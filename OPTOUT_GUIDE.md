# 🚪 Opt-Out / Unregister Guide

## For Streamers: How to Leave the Bot Network

If you no longer want to be part of the CrossTalk bot network, you can easily opt out.

---

## ⚡ Quick Opt-Out

### Step 1: Go to Your Kick Channel
Open your own Kick channel chat

### Step 2: Type the Command
```
!optout
```

Or alternatively:
```
!unregister
```

### Step 3: Confirmation
The bot will respond:
```
✅ You've been removed from the bot network. Your channel will no longer appear in !streamers and users cannot send you messages. To rejoin, use !setupchat again.
```

---

## 🔍 What Happens When You Opt Out?

### ✅ Immediate Effects:

1. **You're removed from the streamers list**
   - Won't appear in `!streamers` command
   - Other users can't see your channel

2. **Messages stop working**
   - Users can't send you messages with `!yourchannelname`
   - You can't receive cross-streamer messages

3. **Bot disconnects from your chat**
   - Bot stops listening to your channel
   - No more chat monitoring

4. **Your data is preserved**
   - Message history stays in database
   - Can rejoin anytime with `!setupchat`
   - Your settings are remembered

### ❌ You're NOT:

- Banned or blocked
- Deleted from database (just marked inactive)
- Unable to rejoin

---

## 🔄 How to Rejoin

Changed your mind? Easy!

### Just type in your chat:
```
!setupchat
```

The bot will:
- Reactivate your channel
- Reconnect to your chat
- Add you back to the streamers list
- Restore your previous cooldown settings

---

## 🤔 Why Opt Out?

Common reasons streamers opt out:

1. **Taking a break** from streaming
2. **Don't want cross-platform messages** anymore
3. **Privacy concerns** about chat monitoring
4. **Testing purposes** - want to temporarily disable
5. **Moving to different platforms**

---

## 🛡️ Privacy & Security

### What Data is Kept?
When you opt out:
- ✅ Message history (for record keeping)
- ✅ Your username and channel name
- ✅ Your settings (cooldown, etc.)

### What Data is Removed?
- ❌ Active chat monitoring stops
- ❌ You're hidden from public lists
- ❌ New messages can't be sent to you

### Complete Deletion
If you want complete deletion (not just opt-out):
- Contact the bot administrator
- Request full data deletion
- Your message history will be removed
- Cannot be undone

---

## 📊 Opt-Out vs Delete

| Feature | Opt-Out (`!optout`) | Full Delete |
|---------|---------------------|-------------|
| Stops messages | ✅ | ✅ |
| Removes from lists | ✅ | ✅ |
| Keeps message history | ✅ | ❌ |
| Can rejoin easily | ✅ | ❌ |
| Preserves settings | ✅ | ❌ |
| Requires admin | ❌ | ✅ |

---

## 💡 Tips

### For Temporary Breaks:
Use `!optout` - you can easily come back later

### For Privacy:
`!optout` stops all chat monitoring immediately

### For Testing:
```
!optout        # Disable
# ... test something ...
!setupchat     # Re-enable
```

### For Multiple Channels:
Each channel must opt out separately (only broadcaster can opt out their channel)

---

## 🔧 Troubleshooting

### "Only the channel broadcaster can use !optout"
**Solution:** Only the channel owner can opt out. Mods cannot do this.

### "Channel not registered. Nothing to opt out of!"
**Solution:** You're already not registered. No action needed.

### Bot still responding after opt-out?
**Solution:** Wait 1-2 minutes for changes to take effect. Try `!help` to check if bot is still active.

### Want to opt out but keep some features?
**Solution:** Currently it's all-or-nothing. Contact admin for custom setup.

---

## 📞 Support

### Common Questions:

**Q: Can I opt out just one streamer?**
A: No, opt-out removes your entire channel from the network.

**Q: Can mods opt out the channel?**
A: No, only the broadcaster can use `!optout`.

**Q: Is my message history deleted?**
A: No, it's preserved. Contact admin for full deletion.

**Q: Can I opt out from someone else's chat?**
A: No, you can only opt out your own channel from your own chat.

**Q: Does opt-out delete my account?**
A: No, it just marks you as inactive. Easy to rejoin.

---

## ⚖️ Your Rights

As a streamer, you have the right to:

✅ Opt out at any time  
✅ Rejoin at any time  
✅ Request full data deletion  
✅ Know what data is stored  
✅ Control your channel's participation  

---

## 🎯 Quick Reference

| Command | What it does | Who can use |
|---------|-------------|-------------|
| `!setupchat` | Register/rejoin | Broadcaster only |
| `!optout` | Leave network | Broadcaster only |
| `!cooldownchat <sec>` | Change cooldown | Broadcaster only |
| `!streamers` | See active list | Anyone |
| `!help` | Show commands | Anyone |

---

**Questions? Check the main README or contact the bot administrator!**
