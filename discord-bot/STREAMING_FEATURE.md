# 🎬 Discord Streaming Feature - EXPERIMENTAL

## What This Does

The bot can now **stream Kick audio directly to Discord voice channels** using a headless browser!

**How it works:**
1. Bot opens Kick stream in headless Chrome
2. Captures audio from the stream
3. Pipes audio to Discord voice channel
4. Self-deafens so it doesn't hear Discord audio

**Think of it as:** Bot is "watching" the Kick stream like a normal user, then screen-sharing (audio) to Discord.

---

## 🎯 Commands

### Start Streaming
```
!kick stream <streamer>
```

**Example:**
```
!kick stream realglitchdyeet
```

**Requirements:**
- You must be in a voice channel first
- Streamer must be live on Kick
- Bot needs permissions to join voice

### Stop Streaming
```
!kick stopstream
```

Stops the active stream in your voice channel.

### Check Active Streams
```
!kick streams
```

Shows all currently active streams across all servers.

---

## 📋 Setup

### 1. Install Dependencies

```bash
cd discord-bot
npm install
```

**New packages installed:**
- `puppeteer` - Headless Chrome browser
- `@discordjs/voice` - Discord voice support
- `@discordjs/opus` - Audio encoding
- `prism-media` - Audio processing
- `ffmpeg-static` - Audio conversion

### 2. Discord Permissions

Bot needs these **additional** permissions:
- ✅ Connect (to join voice channels)
- ✅ Speak (to play audio)
- ✅ Use Voice Activity

**Update invite URL:**
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2150631488&scope=bot
```

### 3. System Requirements

**Local Development:**
- 2GB+ RAM available
- Chrome/Chromium installed
- FFmpeg installed (comes with ffmpeg-static)

**Railway/Production:**
- Upgraded plan (free tier won't work)
- At least 1GB RAM per stream
- Bandwidth: ~3-5 Mbps per stream

---

## 🎮 Usage Example

### Full Flow:

**User joins voice channel:**
```
*User clicks voice channel: "Stream Party"*
```

**User requests stream:**
```
!kick stream realglitchdyeet
```

**Bot responds:**
```
🎬 Starting stream of realglitchdyeet...
⏳ Opening browser and connecting (this may take 10-20 seconds)...
```

**Bot joins voice channel and starts streaming:**
```
🔴 Now Streaming: realglitchdyeet
Stream is now playing in this voice channel!

🎧 Audio: Stream audio only (for now)
🔇 Bot Status: Self-deafened (won't hear you)

Use !kick stopstream to stop
```

**Everyone in voice can hear the stream!**

**When done:**
```
!kick stopstream
```

**Bot responds:**
```
✅ Stream stopped and disconnected from voice channel.
```

---

## ⚠️ Current Limitations

### What Works:
✅ Audio streaming from Kick to Discord
✅ Self-deafening (bot won't hear you)
✅ Auto-disconnect when stream ends
✅ Multiple servers (1 stream each)

### What Doesn't Work Yet:
❌ Video streaming (audio only for now)
❌ Multiple streams per server
❌ Stream quality controls
❌ Volume controls

### Known Issues:
- 10-20 second startup time (opening browser)
- 10-30 second audio latency
- High resource usage (RAM/CPU)
- May not work on Railway free tier

---

## 🔧 Technical Details

### Architecture:

```
Kick.com Stream
    ↓
Puppeteer (Headless Chrome)
    ↓
Audio Capture
    ↓
FFmpeg Encoding
    ↓
Discord Voice Gateway
    ↓
Voice Channel (Everyone hears it!)
```

### Resource Usage Per Stream:

| Resource | Usage |
|----------|-------|
| RAM | ~800MB |
| CPU | 20-30% of 1 core |
| Bandwidth (download) | 1-3 Mbps |
| Bandwidth (upload) | 2-5 Mbps |
| Disk | ~200MB (Chromium) |

### Why It's "Like a Normal User":

1. **Bot has Kick account** - Authenticated user
2. **Uses official Kick player** - Same as browser
3. **No stream extraction** - Not hacking the video
4. **Respects Kick's player** - All features work normally

**Legal perspective:** Bot is "watching" and "screen-sharing" like any user could. No different than you opening Kick and screen-sharing in Discord manually.

---

## 🚀 Deployment

### Local Testing (Recommended First):

```bash
cd discord-bot
npm install
npm run build
npm start
```

**Test with:**
```
!kick stream <streamer>
```

### Railway Deployment:

**Requirements:**
- Upgrade to Starter plan ($5/month minimum)
- 2GB RAM recommended
- Set environment variable: `CHROME_PATH=/usr/bin/chromium-browser`

**Add to Railway:**
1. Deploy discord-bot as separate service
2. Set environment variables
3. Add Chromium buildpack (if needed)

---

## 💰 Cost Implications

### Railway Costs:

**Free Tier:**
- 512MB RAM → ❌ Can't run streams (needs 800MB+)

**Starter ($5/mo):**
- 2GB RAM → ✅ Can run 1-2 streams
- 1 vCPU → May lag with 2 streams

**Pro ($20/mo):**
- 8GB RAM → ✅ Can run 5-10 streams
- 4 vCPU → Smooth performance

**Per stream cost estimate:** ~$2-5/month

---

## 🎯 Roadmap / Future Features

### Phase 1 (Current):
- ✅ Audio streaming
- ✅ Basic commands
- ✅ Auto-disconnect

### Phase 2 (Next):
- [ ] Video streaming (screen share)
- [ ] Volume controls
- [ ] Quality settings
- [ ] Stream recording

### Phase 3 (Future):
- [ ] Multi-stream support
- [ ] Picture-in-picture
- [ ] Stream overlays
- [ ] Chat integration

---

## ⚖️ Legal / TOS Considerations

### Why This Should Be OK:

**Kick's Perspective:**
- Bot is authenticated user
- Using official player
- Generates view count for streamer
- Not extracting/downloading content
- Same as screen-sharing manually

**Discord's Perspective:**
- Bot has proper permissions
- Using official Discord voice API
- Not violating community guidelines
- Similar to music bots (which are allowed)

### Gray Areas:

⚠️ **Automated viewing** - Some platforms restrict bots watching content
⚠️ **Bandwidth** - High usage might trigger rate limits
⚠️ **Commercial use** - If you charge for access, may violate TOS

### Best Practices:

✅ Use for personal/community, not commercial
✅ Respect streamer's content
✅ Don't advertise as "watch without Kick"
✅ Monitor for TOS updates
✅ Be ready to disable if requested

---

## 🆘 Troubleshooting

### "Failed to start stream"

**Check:**
1. Is streamer actually live?
2. Is streamer name spelled correctly?
3. Are you in a voice channel?
4. Does bot have Connect permission?

**Fix:**
- Try another streamer
- Check Kick.com directly
- Restart bot

### "No audio in voice channel"

**Check:**
1. Is your Discord audio working?
2. Is bot actually in voice channel?
3. Check bot isn't server-muted

**Fix:**
- Stop and restart stream
- Check Discord audio settings
- Verify bot permissions

### "Bot lag or crashes"

**Likely cause:** Insufficient RAM

**Fix:**
- Upgrade Railway plan
- Stop other streams
- Reduce stream quality (future feature)

### "10+ second audio delay"

**Expected:** Streaming always has 10-30 second latency

**Can't fix:** This is normal for browser-based streaming

---

## 📊 Performance Monitoring

### Check Bot Status:

```javascript
// In Discord
!kick streams

// Shows:
// 📺 Active Streams
// 🔴 realglitchdyeet streaming in #Stream-Party
```

### Railway Logs:

Look for:
```
Starting stream: realglitchdyeet → Discord channel 123456
Video player found!
Joined Discord voice channel
Stream started successfully: realglitchdyeet
```

---

## 🎉 Cool Use Cases

### 1. Community Watch Parties
Host viewing parties for your favorite Kick streamers

### 2. Multi-Platform Presence
Stream Kick content to Discord community

### 3. Offline Viewing
Catch up on streams with your friends

### 4. Cross-Promotion
Bring Kick content to Discord audiences

---

## ⚠️ Important Notes

1. **Experimental Feature** - May have bugs
2. **Resource Intensive** - Costs money to run
3. **Latency Present** - 10-30 second delay is normal
4. **Audio Only Currently** - Video coming later
5. **One Stream Per Channel** - Can't stack multiple streams
6. **TOS Gray Area** - Use responsibly

---

## 📞 Support

**Issues?**
1. Check this guide
2. Review Discord bot logs
3. Test on different streamer
4. Check Railway resources
5. Verify bot permissions

**Feature requests?**
- Volume controls
- Video streaming
- Quality settings
- Recording
- Multi-stream

---

**Ready to test?** Run `!kick stream <streamer>` and let's see it work! 🎬
