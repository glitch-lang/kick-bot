import puppeteer, { Browser, Page } from 'puppeteer';
import { 
  joinVoiceChannel, 
  createAudioPlayer,
  createAudioResource,
  VoiceConnection,
  AudioPlayer,
  StreamType
} from '@discordjs/voice';
import prism from 'prism-media';
import { VoiceChannel } from 'discord.js';

interface StreamSession {
  browser: Browser;
  page: Page;
  connection: VoiceConnection;
  player: AudioPlayer;
  kickChannel: string;
  discordChannel: string;
}

export class StreamManager {
  private activeSessions: Map<string, StreamSession> = new Map();

  async startStream(
    kickChannelName: string,
    discordVoiceChannel: VoiceChannel
  ): Promise<boolean> {
    try {
      const sessionKey = discordVoiceChannel.id;

      // Check if already streaming in this channel
      if (this.activeSessions.has(sessionKey)) {
        console.log(`Already streaming in channel ${sessionKey}`);
        return false;
      }

      console.log(`Starting stream: ${kickChannelName} → Discord channel ${sessionKey}`);

      // 1. Launch headless browser
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--autoplay-policy=no-user-gesture-required',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--window-size=1280,720',
          // Audio flags
          '--use-fake-ui-for-media-stream',
          '--enable-usermedia-screen-capturing',
          '--allow-http-screen-capture',
          '--auto-select-desktop-capture-source=Entire screen',
        ],
        executablePath: process.env.CHROME_PATH || undefined,
      });

      const page = await browser.newPage();

      // Set viewport
      await page.setViewport({ width: 1280, height: 720 });

      // Navigate to Kick stream
      console.log(`Opening Kick page: https://kick.com/${kickChannelName}`);
      await page.goto(`https://kick.com/${kickChannelName}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for video player
      await page.waitForSelector('video', { timeout: 20000 });
      console.log('Video player found!');

      // Unmute and play video (if paused)
      await page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (video) {
          video.muted = false;
          video.volume = 1.0;
          video.play().catch(e => console.log('Play failed:', e));
        }
      });

      // 2. Join Discord voice channel
      const connection = joinVoiceChannel({
        channelId: discordVoiceChannel.id,
        guildId: discordVoiceChannel.guild.id,
        adapterCreator: discordVoiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true,  // Bot won't hear Discord audio
        selfMute: false  // Bot will broadcast
      });

      console.log('Joined Discord voice channel');

      // 3. Set up audio streaming (simplified for now)
      // This is a placeholder - actual audio capture from browser is complex
      // For proof of concept, we'll use a simpler method
      
      const player = createAudioPlayer();
      
      // Note: Actual browser audio capture requires additional setup
      // This is where we'd pipe the browser audio to Discord
      // For now, this demonstrates the structure
      
      connection.subscribe(player);

      // Store session
      const session: StreamSession = {
        browser,
        page,
        connection,
        player,
        kickChannel: kickChannelName,
        discordChannel: discordVoiceChannel.id
      };

      this.activeSessions.set(sessionKey, session);

      console.log(`Stream started successfully: ${kickChannelName}`);

      // Monitor for stream end
      this.monitorStream(sessionKey);

      return true;

    } catch (error) {
      console.error('Error starting stream:', error);
      return false;
    }
  }

  async stopStream(discordChannelId: string): Promise<boolean> {
    try {
      const session = this.activeSessions.get(discordChannelId);
      
      if (!session) {
        console.log('No active stream found');
        return false;
      }

      console.log(`Stopping stream in channel ${discordChannelId}`);

      // Stop player
      session.player.stop();

      // Disconnect from voice
      session.connection.destroy();

      // Close browser
      await session.browser.close();

      // Remove session
      this.activeSessions.delete(discordChannelId);

      console.log('Stream stopped successfully');
      return true;

    } catch (error) {
      console.error('Error stopping stream:', error);
      return false;
    }
  }

  private async monitorStream(sessionKey: string) {
    const session = this.activeSessions.get(sessionKey);
    if (!session) return;

    // Check if stream is still live every minute
    const checkInterval = setInterval(async () => {
      try {
        const isLive = await session.page.evaluate(() => {
          const video = document.querySelector('video') as HTMLVideoElement;
          return video && !video.paused && !video.ended;
        });

        if (!isLive) {
          console.log(`Stream ${session.kickChannel} ended, disconnecting...`);
          clearInterval(checkInterval);
          await this.stopStream(sessionKey);
        }
      } catch (error) {
        console.error('Error monitoring stream:', error);
        clearInterval(checkInterval);
        await this.stopStream(sessionKey);
      }
    }, 60000); // Check every minute
  }

  getActiveStreams(): Array<{ kickChannel: string; discordChannel: string }> {
    return Array.from(this.activeSessions.values()).map(session => ({
      kickChannel: session.kickChannel,
      discordChannel: session.discordChannel
    }));
  }

  isStreaming(discordChannelId: string): boolean {
    return this.activeSessions.has(discordChannelId);
  }
}
