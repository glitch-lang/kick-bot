# 🎮 Discord Stream Watch Parties - Live Kick Streams in Voice

## The Vision

Enable Discord users to watch Kick streams together in a Discord voice channel, with the bot streaming the Kick stream directly to Discord!

---

## 🎯 **How It Would Work**

### User Experience:
```
1. User: !kick watch realglitchdyeet
2. Bot: "realglitchdyeet is LIVE! Join #watch-party voice channel!"
3. User joins voice channel
4. Bot is already there, streaming the Kick stream
5. Everyone watches together!
6. Both Kick chat and Discord chat are visible/bridged
```

---

## 🏗️ **Technical Architecture**

### Components Needed:

```
┌─────────────────────────────────────────────────────────────┐
│                         VPS Server                          │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │  Xvfb        │──────│  Chromium    │                   │
│  │ (Virtual     │      │  (Puppeteer  │                   │
│  │  Display)    │      │   Controlled)│                   │
│  └──────────────┘      └──────────────┘                   │
│                               │                             │
│                               │ Opens Kick stream           │
│                               │ (https://kick.com/...)     │
│                               ▼                             │
│                        ┌──────────────┐                    │
│                        │   FFmpeg     │                    │
│                        │ - Captures   │                    │
│                        │   video/audio│                    │
│                        │ - Encodes    │                    │
│                        └──────────────┘                    │
│                               │                             │
│                               │ Streams to Discord          │
│                               ▼                             │
│                   ┌────────────────────┐                   │
│                   │  @discordjs/voice  │                   │
│                   │  - Joins voice ch  │                   │
│                   │  - Sends video     │                   │
│                   └────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Internet
                              ▼
                    ┌──────────────────┐
                    │  Discord Server  │
                    │  Voice Channel   │
                    │                  │
                    │  Users watching! │
                    └──────────────────┘
```

---

## 📦 **Dependencies Required**

### NPM Packages:
```json
{
  "dependencies": {
    "puppeteer": "^21.6.1",           // Browser automation
    "@discordjs/voice": "^0.16.1",    // Discord voice connection
    "discord.js": "^14.14.1",         // Discord bot
    "prism-media": "^1.3.5",          // Audio/video processing
    "ffmpeg-static": "^5.2.0",        // FFmpeg binary
    "@types/fluent-ffmpeg": "^2.1.24" // FFmpeg wrapper
  }
}
```

### System Requirements (VPS):
```bash
# Ubuntu/Debian
sudo apt-get install -y \
  chromium-browser \
  xvfb \
  ffmpeg \
  pulseaudio \
  x11vnc
```

---

## 🚀 **Implementation Steps**

### Phase 1: Browser Streaming (Backend)

**1. Set up Puppeteer to open Kick stream:**
```typescript
import puppeteer from 'puppeteer';

async function openKickStream(channelName: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--autoplay-policy=no-user-gesture-required',
      '--use-fake-ui-for-media-stream',
      '--enable-usermedia-screen-capturing',
      '--disable-blink-features=AutomationControlled'
    ],
    executablePath: '/usr/bin/chromium-browser', // VPS path
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });

  const page = await browser.newPage();
  
  // Navigate to Kick stream
  await page.goto(`https://kick.com/${channelName}`, {
    waitUntil: 'networkidle2'
  });
  
  // Click play if needed (Kick auto-plays usually)
  await page.waitForTimeout(2000);
  
  // Make fullscreen
  await page.keyboard.press('f');
  
  return { browser, page };
}
```

**2. Capture browser window with FFmpeg:**
```typescript
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

function captureStream(displayNumber: number) {
  return ffmpeg()
    .setFfmpegPath(ffmpegStatic)
    .input(`:${displayNumber}`) // Xvfb display
    .inputFormat('x11grab')
    .size('1920x1080')
    .fps(30)
    .videoCodec('libx264')
    .audioCodec('aac')
    .format('matroska') // Or 'opus' for Discord
    .outputOptions([
      '-preset ultrafast',
      '-tune zerolatency',
      '-b:v 2500k',
      '-maxrate 2500k',
      '-bufsize 5000k'
    ]);
}
```

---

### Phase 2: Discord Voice Integration

**1. Join Discord voice channel:**
```typescript
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  entersState,
  VoiceConnectionStatus
} from '@discordjs/voice';

async function joinAndStream(
  guildId: string,
  channelId: string,
  streamSource: any
) {
  const connection = joinVoiceChannel({
    channelId: channelId,
    guildId: guildId,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false
  });

  await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

  const player = createAudioPlayer();
  const resource = createAudioResource(streamSource, {
    inputType: StreamType.Arbitrary,
  });

  player.play(resource);
  connection.subscribe(player);

  return { connection, player };
}
```

**2. Stream video to Discord (experimental):**
```typescript
// Note: Discord voice channels support AUDIO only by default
// VIDEO streaming requires Discord's "Go Live" feature
// which is limited to screen share, not bot streaming

// Alternative: Use Discord's video API (if available)
// Or stream audio only + provide web link for video
```

---

### Phase 3: Complete Watch Party System

**Full command implementation:**
```typescript
async function handleWatchPartyCommand(message: any, streamerName: string) {
  // 1. Check if streamer is live
  const isLive = await checkIfLive(streamerName);
  if (!isLive) {
    return message.reply(`${streamerName} is not live right now!`);
  }

  // 2. Find or create voice channel
  const voiceChannel = await findWatchPartyChannel(message.guild);
  
  // 3. Start browser and open stream
  const { browser, page } = await openKickStream(streamerName);
  
  // 4. Start FFmpeg capture
  const streamCapture = captureStream(99); // Xvfb display :99
  
  // 5. Join Discord voice and stream
  const { connection, player } = await joinAndStream(
    message.guild.id,
    voiceChannel.id,
    streamCapture
  );
  
  // 6. Send notification
  await message.reply(
    `📺 Now streaming **${streamerName}** in ${voiceChannel}!\n` +
    `Join the voice channel to watch together! 🎉`
  );
  
  // 7. Monitor stream status
  monitorStream(streamerName, browser, connection, player);
}
```

---

## ⚠️ **Challenges & Limitations**

### Discord Limitations:
```
❌ Discord voice channels: AUDIO ONLY by default
❌ "Go Live" feature: Screen share only, not bot-initiated
❌ Bots cannot use "Go Live" feature
❌ Video streaming requires unofficial/experimental APIs
```

### Solutions:
```
✅ Option 1: Audio-only stream + provide web link for video
✅ Option 2: Use Discord stage channels (audio focus)
✅ Option 3: Create a web viewer (embed Kick stream)
✅ Option 4: Use Discord's experimental video APIs (risky)
✅ Option 5: Hybrid: Bot audio + users open Kick in browser
```

---

## 🎯 **Recommended Approach**

### **Hybrid Watch Party:**

**What the bot does:**
1. ✅ Streams Kick **AUDIO** to Discord voice
2. ✅ Posts Kick stream **LINK** to text channel
3. ✅ Bridges chat messages (Kick ↔ Discord)
4. ✅ Notifies when stream goes live/offline

**What users do:**
1. Join Discord voice channel (hear stream audio)
2. Open Kick link in browser (see video)
3. Chat in Discord (synced to Kick)

**Benefits:**
- ✅ Legal & ToS compliant
- ✅ Better video quality (direct from Kick)
- ✅ Synchronized audio in Discord voice
- ✅ Shared experience + chat

---

## 💻 **Alternative: Web-Based Watch Party**

Create a web page that embeds:
- Kick stream (iframe or player API)
- Discord chat widget
- Voice channel controls

Users go to: `https://yourbot.com/watch/realglitchdyeet`

---

## 📊 **Cost Estimate**

### VPS Requirements:
```
CPU: 4+ cores (for FFmpeg encoding)
RAM: 8GB+ (browser + encoding)
Storage: 20GB SSD
GPU: Optional (better encoding)
Bandwidth: Unlimited or high limit

Estimated cost: $20-50/month
Recommended: Hetzner, DigitalOcean, Linode
```

### Streaming Costs:
```
Discord: Free (no API costs)
Kick API: Free (public streams)
VPS: $20-50/month
Domain: $10/year (optional)
```

---

## 🛠️ **Setup Guide (If Implementing)**

### 1. VPS Setup:
```bash
# Install dependencies
sudo apt update
sudo apt install -y chromium-browser xvfb ffmpeg pulseaudio

# Start virtual display
Xvfb :99 -screen 0 1920x1080x24 &
export DISPLAY=:99

# Test Chromium
chromium-browser --version
```

### 2. Install Bot Dependencies:
```bash
cd kick-bot/discord-bot
npm install puppeteer @discordjs/voice prism-media ffmpeg-static
```

### 3. Configure Bot:
```env
# .env
ENABLE_WATCH_PARTIES=true
VPS_DISPLAY=:99
WATCH_PARTY_VOICE_CHANNEL_ID=123456789
```

### 4. Test:
```
!kick watch realglitchdyeet
```

---

## 🎮 **Feature Roadmap**

### MVP (Minimum Viable Product):
- [ ] Audio-only streaming to Discord voice
- [ ] Post Kick stream link in text channel
- [ ] Notification when stream goes live
- [ ] Chat bridge (Kick ↔ Discord)

### Enhanced Features:
- [ ] Multiple watch parties (different streams)
- [ ] Queue system (if multiple streams requested)
- [ ] Clip sharing
- [ ] Emoji reactions synced
- [ ] Poll integration

### Advanced (Future):
- [ ] Full video streaming (if Discord allows)
- [ ] Web-based watch party page
- [ ] VOD playback
- [ ] Multi-stream mosaic view

---

## ⚖️ **Legal Considerations**

### Kick ToS:
✅ Public streams are embeddable
✅ No restreaming restrictions mentioned
⚠️ Check Kick's ToS for updates

### Discord ToS:
✅ Bots can join voice channels
✅ Audio streaming is allowed
⚠️ Video streaming may be restricted

### Copyright:
⚠️ Stream content belongs to streamer
⚠️ Get permission for restreaming
✅ Watch parties with links = OK

---

## 🎯 **Next Steps**

Want me to implement this? Here's what we'd do:

1. **Choose approach:**
   - Audio-only + links (easiest, recommended)
   - Full video streaming (complex, experimental)
   - Web-based viewer (medium difficulty)

2. **Set up VPS:**
   - Provision server
   - Install dependencies
   - Configure Xvfb

3. **Implement bot features:**
   - Browser automation
   - Voice connection
   - Stream capture
   - Chat bridge

4. **Test & deploy:**
   - Test with live streams
   - Monitor performance
   - Optimize encoding

---

## 🚀 **Want to Build This?**

Let me know which approach you prefer and I'll start implementing! The **audio + link hybrid** is the most practical and ToS-compliant option! 🎉
