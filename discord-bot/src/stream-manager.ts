import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  AudioPlayerStatus,
  VoiceConnection,
  AudioPlayer,
  entersState,
  VoiceConnectionStatus,
  getVoiceConnection
} from '@discordjs/voice';
import { VoiceChannel, TextChannel, Guild } from 'discord.js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import axios from 'axios';
import { Readable } from 'stream';

// Set FFmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

interface ActiveStream {
  streamerName: string;
  connection: VoiceConnection;
  player: AudioPlayer;
  guildId: string;
  voiceChannelId: string;
  textChannelId: string;
  kickStreamUrl: string;
  startedAt: Date;
}

export class StreamManager {
  private activeStreams: Map<string, ActiveStream> = new Map();
  private kickApiUrl: string;

  constructor(kickApiUrl: string) {
    this.kickApiUrl = kickApiUrl;
  }

  async startWatchParty(
    streamerName: string,
    voiceChannel: VoiceChannel,
    textChannel: TextChannel
  ): Promise<string> {
    const guildId = voiceChannel.guild.id;
    const streamKey = `${guildId}-${streamerName}`;

    // Check if already streaming
    if (this.activeStreams.has(streamKey)) {
      return `Already watching ${streamerName} in this server!`;
    }

    try {
      // 1. Check if streamer is live
      const streamInfo = await this.getKickStreamInfo(streamerName);
      if (!streamInfo.isLive) {
        return `${streamerName} is not live right now! Check back later.`;
      }

      // 2. Get stream playback URL
      const playbackUrl = streamInfo.playbackUrl;
      if (!playbackUrl) {
        return `Could not get stream URL for ${streamerName}. They might be offline.`;
      }

      console.log(`🎬 Starting watch party for ${streamerName}`);
      console.log(`📺 Stream URL: ${playbackUrl}`);

      // 3. Join voice channel
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator as any,
        selfDeaf: false,
        selfMute: false
      });

      // Wait for connection to be ready
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
      console.log('✅ Connected to voice channel');

      // 4. Create audio player
      const player = createAudioPlayer();

      // 5. Extract and stream audio
      const audioStream = await this.extractAudioStream(playbackUrl);
      const resource = createAudioResource(audioStream, {
        inputType: StreamType.Arbitrary,
      });

      player.play(resource);
      connection.subscribe(player);

      console.log('🎵 Audio streaming started');

      // 6. Store active stream
      this.activeStreams.set(streamKey, {
        streamerName,
        connection,
        player,
        guildId,
        voiceChannelId: voiceChannel.id,
        textChannelId: textChannel.id,
        kickStreamUrl: `https://kick.com/${streamerName}`,
        startedAt: new Date()
      });

      // 7. Handle player events
      player.on(AudioPlayerStatus.Idle, () => {
        console.log(`⏸️ Stream ended for ${streamerName}`);
        this.stopWatchParty(guildId, streamerName);
      });

      player.on('error', (error) => {
        console.error(`❌ Audio player error for ${streamerName}:`, error);
        this.stopWatchParty(guildId, streamerName);
      });

      // 8. Send notification to text channel
      const embedData: any = {
        color: 0x00ff00,
        title: `🎬 Now Watching: ${streamerName}`,
        description: `Join ${voiceChannel} to listen!\n\n**Watch the video:** ${streamInfo.kickUrl}\n\n🎮 Stream Title: ${streamInfo.title || 'Live Stream'}`,
        fields: [
          {
            name: '👥 Viewers',
            value: streamInfo.viewers?.toString() || 'Unknown',
            inline: true
          },
          {
            name: '🎮 Category',
            value: streamInfo.category || 'Unknown',
            inline: true
          }
        ],
        footer: {
          text: 'Use !kick unwatch to stop'
        },
        timestamp: new Date().toISOString()
      };
      
      if (streamInfo.thumbnail) {
        embedData.thumbnail = { url: streamInfo.thumbnail };
      }
      
      await textChannel.send({
        embeds: [embedData]
      });

      return `✅ Now streaming ${streamerName}'s audio to voice! Open the link above to watch the video.`;

    } catch (error: any) {
      console.error(`❌ Failed to start watch party:`, error);
      // Clean up if something went wrong
      this.stopWatchParty(guildId, streamerName);
      return `Failed to start watch party: ${error.message}`;
    }
  }

  async stopWatchParty(guildId: string, streamerName?: string): Promise<string> {
    if (streamerName) {
      // Stop specific stream
      const streamKey = `${guildId}-${streamerName}`;
      const stream = this.activeStreams.get(streamKey);

      if (!stream) {
        return `Not currently watching ${streamerName}!`;
      }

      stream.player.stop();
      stream.connection.destroy();
      this.activeStreams.delete(streamKey);

      console.log(`⏹️ Stopped watch party for ${streamerName}`);
      return `Stopped watching ${streamerName}`;
    } else {
      // Stop all streams in this guild
      let stoppedCount = 0;
      for (const [key, stream] of this.activeStreams.entries()) {
        if (stream.guildId === guildId) {
          stream.player.stop();
          stream.connection.destroy();
          this.activeStreams.delete(key);
          stoppedCount++;
        }
      }

      if (stoppedCount === 0) {
        return 'No active watch parties in this server!';
      }

      console.log(`⏹️ Stopped ${stoppedCount} watch parties`);
      return `Stopped ${stoppedCount} watch ${stoppedCount === 1 ? 'party' : 'parties'}`;
    }
  }

  getActiveStreams(guildId?: string): ActiveStream[] {
    const streams = Array.from(this.activeStreams.values());
    return guildId 
      ? streams.filter(s => s.guildId === guildId)
      : streams;
  }

  private async getKickStreamInfo(streamerName: string): Promise<{
    isLive: boolean;
    playbackUrl?: string;
    kickUrl: string;
    title?: string;
    viewers?: number;
    category?: string;
    thumbnail?: string;
  }> {
    try {
      // Use your Kick bot's API endpoint
      const response = await axios.get(`${this.kickApiUrl}/api/kick/streamer/${streamerName}`);
      const data = response.data;

      if (!data.success) {
        return {
          isLive: false,
          kickUrl: `https://kick.com/${streamerName}`
        };
      }

      const streamer = data.streamer;
      const isLive = streamer.is_live || false;

      // Get playback URL if live
      let playbackUrl: string | undefined;
      if (isLive && streamer.playback_url) {
        playbackUrl = streamer.playback_url;
      } else if (isLive) {
        // Try to fetch from Kick's public API
        try {
          const kickResponse = await axios.get(`https://kick.com/api/v2/channels/${streamerName}/livestream`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json',
              'Accept-Language': 'en-US,en;q=0.9',
              'Referer': 'https://kick.com/',
              'Origin': 'https://kick.com'
            }
          });
          if (kickResponse.data && kickResponse.data.playback_url) {
            playbackUrl = kickResponse.data.playback_url;
          }
        } catch (err) {
          console.error('Could not fetch playback URL from Kick API');
        }
      }

      return {
        isLive,
        playbackUrl,
        kickUrl: `https://kick.com/${streamerName}`,
        title: streamer.livestream?.session_title,
        viewers: streamer.livestream?.viewer_count,
        category: streamer.livestream?.category?.name,
        thumbnail: streamer.livestream?.thumbnail?.url
      };
    } catch (error: any) {
      console.error(`Error fetching stream info for ${streamerName}:`, error.message);
      return {
        isLive: false,
        kickUrl: `https://kick.com/${streamerName}`
      };
    }
  }

  private async extractAudioStream(playbackUrl: string): Promise<Readable> {
    return new Promise((resolve, reject) => {
      const stream = ffmpeg(playbackUrl)
        .inputOptions([
          '-reconnect 1',
          '-reconnect_streamed 1',
          '-reconnect_delay_max 5',
          '-fflags nobuffer',              // Reduce buffering
          '-flags low_delay',              // Low latency mode
          '-probesize 32',                 // Faster stream detection
          '-analyzeduration 0',            // Skip analysis for faster start
          '-thread_queue_size 512'         // Larger thread queue
        ])
        .audioCodec('libopus')
        .audioFrequency(48000)
        .audioChannels(2)
        .audioBitrate('128k')              // Explicit bitrate
        .format('opus')
        .outputOptions([
          '-application lowdelay',         // Opus low delay mode
          '-frame_duration 20',            // Smaller frame size
          '-packet_loss 15'                // Handle packet loss
        ])
        .on('start', (cmd) => {
          console.log('🎵 FFmpeg started (low latency mode):', cmd);
        })
        .on('error', (err) => {
          console.error('❌ FFmpeg error:', err);
          reject(err);
        });

      const outputStream = stream.pipe() as Readable;
      resolve(outputStream);
    });
  }
}
