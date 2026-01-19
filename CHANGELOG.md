# Changelog

## New Features Added

### !online Command
- Viewers can now use `!online` to check which streamers are currently live
- Shows online streamers with viewer counts and stream titles
- Lists offline streamers separately
- Only shows streamers that the current channel has commands for

### Automatic Refund System
- When a viewer tries to send a message to an offline streamer, their channel points are automatically refunded
- Cooldown is removed when a refund occurs
- User is notified that the streamer is offline and their points have been refunded
- Refunds are tracked in the database for record-keeping

## Technical Changes

### Database
- Added `refunds` table to track refund transactions
- Added `removeCooldown()` function to clear cooldowns when refunding
- Added `markRequestRefunded()` function for future use

### API
- Added `isStreamerLive()` method to check if a streamer is currently live
- Added `getStreamerStatus()` method to get detailed stream status (live status, title, viewer count)

### Bot Logic
- Added `handleOnlineCommand()` to process `!online` requests
- Modified `handleCommand()` to check online status before processing
- Automatic refund and cooldown removal when target streamer is offline

### Server API
- Added `/api/online-status` endpoint to get online status of all streamers
- Added `/api/streamer/:id/refunds` endpoint to view refund history

## Usage Examples

### !online Command
```
Viewer: !online
Bot: 📺 Online Streamers:
     🟢 jerzyNFT 👁️ 1234 viewers - Playing Games
     🟢 streamer2 👁️ 567 viewers - Just Chatting
     
     💤 Offline:
     ⚫ streamer3
```

### Automatic Refund
```
Viewer: !jerzy Hey!
Bot: @viewer jerzyNFT is currently offline. Your 100 channel points have been refunded. Use !online to check who's live!
```

## Notes

- The refund system works automatically - no manual intervention needed
- Online status is checked in real-time when a command is used
- The `!online` command only shows streamers that the current channel has commands configured for
- Refunds are logged in the database for transparency and auditing
