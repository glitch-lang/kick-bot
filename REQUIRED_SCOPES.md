# Required Kick API Scopes

When creating your Kick Developer App, you need to enable the following scopes/permissions:

## ✅ REQUIRED Scopes (Check These):

1. **✅ Read user information (including email address)**
   - Needed to identify users during OAuth
   - Scope: `user:read`

2. **✅ Write to Chat feed**
   - **CRITICAL** - Required to send messages to chat
   - Scope: `chat:write`

3. **✅ Read channel information**
   - Needed to get channel details and check if streamers are online
   - Scope: `channel:read`

4. **✅ Subscribe to events (read chat feed, follows, subscribes, gifts)**
   - **CRITICAL** - Required to listen to chat messages and detect commands (!jerzy, !respond, !online)
   - Without this, the bot cannot read chat messages
   - Scope: `events:subscribe`

5. **✅ Read Channel points rewards information on a channel**
   - Needed to check channel points and verify users have enough points
   - Scope: `channel_points:read`

## ❌ NOT Required (You can leave these unchecked):

- Update channel information
- Execute moderation actions on chat messages
- Read stream key
- Read, add, edit and delete Channel points rewards on a channel
- Execute moderation actions for moderators
- Read KICKs related information (leaderboards, etc.)

## Summary

**Check these 5 scopes:**
1. ✅ Read user information (including email address)
2. ✅ Write to Chat feed
3. ✅ Read channel information
4. ✅ Subscribe to events (read chat feed, follows, subscribes, gifts)
5. ✅ Read Channel points rewards information on a channel

These are the minimum required scopes for the bot to function properly.
