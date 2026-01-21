import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  AudioPlayerStatus,
  VoiceConnection,
  AudioPlayer,
  entersState,
  VoiceConnectionStatus
} from '@discordjs/voice';
import { VoiceChannel, TextChannel } from 'discord.js';
import puppeteer, { Browser, Page } from 'puppeteer-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { Readable } from 'stream';

// Set FFmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

interface BrowserStream {
  streamerName: string;
  browser: Browser;
  page: Page;
  connection: VoiceConnection;
  player: AudioPlayer;
  guildId: string;
  voiceChannelId: string;
  startedAt: Date;
}

export class BrowserStreamManager {
  private activeStreams: Map<string, BrowserStream> = new Map();

  async startBrowserStream(
    streamerName: string,
    voiceChannel: VoiceChannel,
    textChannel: TextChannel
  ): Promise<string> {
    const guildId = voiceChannel.guild.id;
    const streamKey = `${guildId}-${streamerName}`;

    // Check if already streaming
    if (this.activeStreams.has(streamKey)) {
      return `Already streaming ${streamerName} in this server!`;
    }

    try {
      await textChannel.send(`🌐 **Opening browser for ${streamerName}...**\nThis may take 10-15 seconds...`);

      // 1. Launch headless browser
      console.log('🌐 Launching browser...');
      
      // Try to find Chrome/Chromium executable (required for puppeteer-core)
      const executablePath = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
      
      if (!executablePath) {
        console.error('❌ No Chrome executable found. Set CHROME_PATH or PUPPETEER_EXECUTABLE_PATH');
        return `❌ Browser streaming is not available on this deployment. Use watch parties instead with \`/kick stream ${streamerName}\`!`;
      }
      
      const browser = await puppeteer.launch({
        executablePath,
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--autoplay-policy=no-user-gesture-required',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled'
        ],
        defaultViewport: {
          width: 1920,
          height: 1080
        }
      });

      const page = await browser.newPage();

      // Set realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // 2. Set up response listener BEFORE navigation
      console.log('📡 Setting up network monitoring...');
      const m3u8Urls: string[] = [];
      
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('.m3u8')) {
          console.log(`📡 Captured m3u8: ${url.substring(0, 80)}...`);
          m3u8Urls.push(url);
        }
      });

      // 3. Navigate to Kick stream
      console.log(`📺 Navigating to https://kick.com/${streamerName}`);
      await page.goto(`https://kick.com/${streamerName}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      console.log('⏳ Waiting for stream to load...');
      await page.waitForTimeout(5000);

      // 4. Extract stream URL from page
      console.log('🔍 Extracting stream URL...');
      let streamUrl = await this.extractStreamUrlFromPage(page);
      
      // If extraction methods failed, check our captured URLs
      if (!streamUrl && m3u8Urls.length > 0) {
        console.log(`✅ Using captured m3u8 URL from network monitor`);
        streamUrl = m3u8Urls[0];
      }

      if (!streamUrl) {
        await browser.close();
        return `Could not find stream URL for ${streamerName}. They might be offline.`;
      }

      console.log(`✅ Found stream URL: ${streamUrl.substring(0, 100)}...`);

      // 4. Join voice channel
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator as any,
        selfDeaf: false,
        selfMute: false
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
      console.log('✅ Connected to voice channel');

      // 5. Create audio player and stream
      const player = createAudioPlayer();
      const audioStream = await this.createOptimizedAudioStream(streamUrl);
      const resource = createAudioResource(audioStream, {
        inputType: StreamType.Arbitrary,
      });

      player.play(resource);
      connection.subscribe(player);

      console.log('🎵 Audio streaming started (browser mode)');

      // 6. Store active stream
      this.activeStreams.set(streamKey, {
        streamerName,
        browser,
        page,
        connection,
        player,
        guildId,
        voiceChannelId: voiceChannel.id,
        startedAt: new Date()
      });

      // 7. Handle player events
      player.on(AudioPlayerStatus.Idle, () => {
        console.log(`⏸️ Stream ended for ${streamerName}`);
        this.stopBrowserStream(guildId, streamerName);
      });

      player.on('error', (error) => {
        console.error(`❌ Audio player error for ${streamerName}:`, error);
        this.stopBrowserStream(guildId, streamerName);
      });

      // 8. Send success message
      await textChannel.send({
        embeds: [{
          color: 0x00ff00,
          title: `🌐 Now Streaming (Browser Mode): ${streamerName}`,
          description: `Join ${voiceChannel} to listen!\n\n**Watch:** https://kick.com/${streamerName}\n\n✨ Using real-time browser capture for better reliability!`,
          footer: {
            text: 'Use !kick stopstream to stop • Browser-based streaming'
          },
          timestamp: new Date().toISOString()
        }]
      });

      return `✅ Now streaming ${streamerName}'s audio via browser!`;

    } catch (error: any) {
      console.error(`❌ Failed to start browser stream:`, error);
      return `Failed to start browser stream: ${error.message}`;
    }
  }

  async stopBrowserStream(guildId: string, streamerName?: string): Promise<string> {
    if (streamerName) {
      const streamKey = `${guildId}-${streamerName}`;
      const stream = this.activeStreams.get(streamKey);

      if (!stream) {
        return `Not currently streaming ${streamerName}!`;
      }

      // Clean up
      stream.player.stop();
      stream.connection.destroy();
      await stream.browser.close();
      this.activeStreams.delete(streamKey);

      console.log(`⏹️ Stopped browser stream for ${streamerName}`);
      return `Stopped streaming ${streamerName}`;
    } else {
      // Stop all streams in guild
      let stoppedCount = 0;
      for (const [key, stream] of this.activeStreams.entries()) {
        if (stream.guildId === guildId) {
          stream.player.stop();
          stream.connection.destroy();
          await stream.browser.close();
          this.activeStreams.delete(key);
          stoppedCount++;
        }
      }

      if (stoppedCount === 0) {
        return 'No active browser streams in this server!';
      }

      return `Stopped ${stoppedCount} browser stream(s)`;
    }
  }

  getActiveStreams(guildId?: string): BrowserStream[] {
    const streams = Array.from(this.activeStreams.values());
    return guildId 
      ? streams.filter(s => s.guildId === guildId)
      : streams;
  }

  private async extractStreamUrlFromPage(page: Page): Promise<string | null> {
    try {
      const m3u8Urls: string[] = [];
      
      // Set up network listener BEFORE navigation
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('.m3u8')) {
          console.log(`📡 Captured m3u8 URL: ${url.substring(0, 100)}...`);
          m3u8Urls.push(url);
        }
      });

      // Method 1: Check if already on page, extract from window object
      const windowStreamUrl = await page.evaluate(() => {
        // @ts-ignore
        if (window.__NUXT__?.state?.channel?.livestream?.playback_url) {
          // @ts-ignore
          return window.__NUXT__.state.channel.livestream.playback_url;
        }
        // @ts-ignore
        if (window.__NUXT__?.state?.livestream?.playback_url) {
          // @ts-ignore
          return window.__NUXT__.state.livestream.playback_url;
        }
        return null;
      });

      if (windowStreamUrl) {
        console.log('✅ Found stream URL from window.__NUXT__');
        return windowStreamUrl;
      }

      // Method 2: Wait for video element to load
      try {
        await page.waitForSelector('video', { timeout: 10000 });
        console.log('✅ Video element found, extracting src...');
        
        const videoSrc = await page.evaluate(() => {
          // @ts-ignore
          const video = document.querySelector('video');
          if (video) {
            // @ts-ignore
            return video.src || video.currentSrc;
          }
          return null;
        });

        if (videoSrc && videoSrc.includes('m3u8')) {
          console.log('✅ Found stream URL from video element');
          return videoSrc;
        }
      } catch (e) {
        console.log('⚠️ Video element not found or timeout');
      }

      // Method 3: Check captured network requests
      await page.waitForTimeout(3000); // Give more time for network requests
      
      if (m3u8Urls.length > 0) {
        console.log(`✅ Found ${m3u8Urls.length} m3u8 URL(s) from network`);
        // Return the master playlist (usually the one without resolution)
        const masterPlaylist = m3u8Urls.find(url => !url.match(/\d+p\.m3u8/)) || m3u8Urls[0];
        return masterPlaylist;
      }

      // Method 4: Search page source for m3u8
      const pageContent = await page.content();
      const m3u8Match = pageContent.match(/(https:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*)/);
      if (m3u8Match) {
        console.log('✅ Found stream URL from page source');
        return m3u8Match[1];
      }

      // Method 5: Try to get from API directly
      const pageUrl = page.url();
      const channelMatch = pageUrl.match(/kick\.com\/([^\/]+)/);
      if (channelMatch) {
        const channelName = channelMatch[1];
        console.log(`🔍 Trying to fetch API for channel: ${channelName}`);
        
        const apiUrl = `https://kick.com/api/v2/channels/${channelName}/livestream`;
        try {
          const apiResponse = await page.evaluate(async (url) => {
            const response = await fetch(url);
            const data: any = await response.json();
            return data?.playback_url || null;
          }, apiUrl);
          
          if (apiResponse) {
            console.log('✅ Found stream URL from Kick API');
            return apiResponse;
          }
        } catch (apiError) {
          console.log('⚠️ API fetch failed:', apiError);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error extracting stream URL:', error);
      return null;
    }
  }

  private async createOptimizedAudioStream(streamUrl: string): Promise<Readable> {
    return new Promise((resolve, reject) => {
      const stream = ffmpeg(streamUrl)
        .inputOptions([
          '-reconnect 1',
          '-reconnect_streamed 1',
          '-reconnect_delay_max 5',
          '-fflags nobuffer+fastseek+flush_packets',
          '-flags low_delay',
          '-strict experimental',
          '-probesize 32',
          '-analyzeduration 0'
        ])
        .audioCodec('libopus')
        .audioFrequency(48000)
        .audioChannels(2)
        .audioBitrate('128k')
        .format('opus')
        .outputOptions([
          '-application lowdelay',
          '-frame_duration 20',
          '-packet_loss 15',
          '-vbr off'
        ])
        .on('start', (cmd) => {
          console.log('🎵 FFmpeg started (browser + low latency):', cmd);
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
