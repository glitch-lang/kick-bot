# 🎵 Voice Streaming Test Guide (Local Windows)

## Prerequisites

Before testing voice streaming, you need:

### 1. **FFmpeg Installed on Windows**
The bot needs FFmpeg to extract audio from Kick streams.

**Download & Install:**
```
1. Go to: https://www.gyan.dev/ffmpeg/builds/
2. Download: ffmpeg-release-essentials.zip
3. Extract to: C:\ffmpeg
4. Add to PATH:
   - Open: System Properties → Environment Variables
   - Edit "Path" → Add: C:\ffmpeg\bin
5. Verify:
   Open PowerShell and run: ffmpeg -version
```

**OR Quick Install with Chocolatey:**
```powershell
choco install ffmpeg
```

### 2. **libsodium Installed**
Required for Discord voice encryption.

**Already installed via npm!** ✅
- `libsodium-wrappers` was added to `package.json`
- Installed when you ran `npm install`

### 3. **Discord Bot Has Voice Permissions**
Make sure your bot has these permissions in Discord:
- ✅ Connect to voice channels
- ✅ Speak in voice channels
- ✅ Use Voice Activity

---

## 🎮 Testing Voice Streaming

### **Step 1: Make Sure Kick Bot is Running**

The Discord bot needs the Kick bot API to fetch stream URLs.

**Check if it's running on Railway:**
- Visit: https://web-production-56232.up.railway.app/health
- Should show: `{"status":"ok"}`

**OR run it locally:**
```powershell
cd C:\Users\willc\kick-bot
npm start
```

---

### **Step 2: Join a Voice Channel**

1. Open Discord
2. Join any voice channel in your test server
3. Make sure the bot can see the channel

---

### **Step 3: Start a Voice Stream**

In Discord, run:
```
!kick stream realglitchdyeet
```

**Replace `realglitchdyeet` with any live Kick streamer!**

---

### **What Should Happen:**

1. **Bot responds:**
   ```
   🎬 Starting stream of realglitchdyeet...
   ⏳ Connecting to Kick stream (this may take 5-10 seconds)...
   ```

2. **Bot joins voice channel** and sends embed:
   ```
   🎬 Now Watching: realglitchdyeet
   Join <voice_channel> to listen!
   
   Watch the video: https://kick.com/realglitchdyeet
   🎮 Stream Title: [Stream Title]
   👥 Viewers: 123
   🎮 Category: Just Chatting
   ```

3. **Audio starts playing** in the voice channel! 🎵

---

### **Step 4: Stop the Stream**

To stop streaming:
```
!kick stopstream
```

---

### **Step 5: Check Active Streams**

To see what's currently streaming:
```
!kick streams
```

---

## 🚨 **Troubleshooting**

### **Error: "Could not get stream URL"**

**Cause:** Streamer is offline or Kick API returned no playback URL.

**Solution:**
1. Check if the streamer is actually live on Kick
2. Try a different streamer
3. Check Railway logs to see what the API returned

---

### **Error: "FFmpeg not found"**

**Cause:** FFmpeg is not installed or not in PATH.

**Solution:**
```powershell
# Check if FFmpeg is installed:
ffmpeg -version

# If not found, install it:
choco install ffmpeg
# OR manually download and add to PATH
```

---

### **Bot joins voice but no audio**

**Cause:** Stream URL might be invalid or FFmpeg can't decode it.

**Check Discord bot terminal for errors:**
```
❌ FFmpeg error: [error message]
```

**Solutions:**
1. Check if the stream is actually live
2. Check FFmpeg logs in the terminal
3. Try a different streamer

---

### **"Bot is already streaming"**

**Solution:**
```
!kick stopstream
# Wait 2 seconds
!kick stream realglitchdyeet
```

---

### **Bot disconnects immediately**

**Cause:** Discord voice connection issues or FFmpeg crash.

**Check for:**
1. Bot has voice permissions in Discord
2. FFmpeg is working (`ffmpeg -version`)
3. Stream URL is valid (check logs)

---

## 📊 **Expected Behavior**

### **Successful Stream:**
```
✅ Bot joins voice channel
✅ Audio starts playing within 5-10 seconds
✅ Embed shows stream info
✅ Users can hear the stream in voice
✅ Bot stays in voice until stopped
```

### **Graceful Failures:**
```
❌ Streamer offline → Bot notifies you
❌ No stream URL → Bot notifies you
❌ FFmpeg error → Bot logs error and disconnects
```

---

## 🎯 **Test Scenarios**

### **Scenario 1: Basic Test**
```
1. Join voice channel
2. !kick stream realglitchdyeet
3. Listen for audio
4. !kick stopstream
```

### **Scenario 2: Multiple Streams**
```
1. Join voice channel #1
2. !kick stream realglitchdyeet
3. (In different server) Join voice channel #2
4. !kick stream anotherststrеamer
5. Both should play simultaneously!
```

### **Scenario 3: Streamer Goes Offline**
```
1. !kick stream somstreamer
2. Wait for streamer to end stream
3. Bot should detect and disconnect
```

---

## 🔧 **Advanced: Check Logs**

### **Discord Bot Logs:**
Look in the terminal where you ran `npm start` for:
```
🎬 Starting watch party for realglitchdyeet
📺 Stream URL: [m3u8 URL]
✅ Connected to voice channel
🎵 FFmpeg started: [command]
🎵 Audio streaming started
```

### **Kick Bot Logs (Railway):**
Check Railway logs for:
```
✅ Migration: Added discord_user_id column
Livestream data for realglitchdyeet: {...}
```

---

## 🎵 **How It Works**

```
1. Discord User: !kick stream realglitchdyeet
   └─> Discord bot calls Kick bot API

2. Kick Bot API:
   └─> Fetches stream info from Kick.com/api/v2/channels/realglitchdyeet/livestream
   └─> Returns playback_url (m3u8 HLS stream)

3. Discord Bot:
   └─> Joins voice channel
   └─> Spawns FFmpeg process
   └─> FFmpeg downloads m3u8 stream, extracts audio
   └─> Pipes audio to Discord voice as Opus

4. Discord Voice:
   └─> Users hear the audio! 🎉
```

---

## 🚀 **Next Steps**

Once local testing works:

1. **Deploy to VPS** for 24/7 streaming
2. **Add video support** (experimental)
3. **Add multiple simultaneous streams**
4. **Add stream queue system**

Check `DISCORD_STREAM_WATCH_PARTIES.md` for full VPS deployment guide!

---

## ✅ **Quick Test Checklist**

Before testing, verify:

- [ ] FFmpeg installed (`ffmpeg -version` works)
- [ ] Discord bot running locally (`npm start` in discord-bot/)
- [ ] Kick bot API accessible (Railway or local)
- [ ] Bot in Discord server with voice permissions
- [ ] You're in a voice channel
- [ ] Test streamer is actually live on Kick

**Then run:** `!kick stream <streamer>` 🎵
