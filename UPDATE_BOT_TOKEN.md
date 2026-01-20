# Update Bot Token After Registration

## If You Registered the Bot Account (CrossTalkBot)

1. **Check the browser** - You should have been redirected to a page showing:
   - Your access token
   - Instructions to copy it

2. **Copy the token** from that page

3. **Update .env file**:
   ```
   BOT_ACCESS_TOKEN=your_new_token_here
   ```

4. **Restart the bot**:
   ```bash
   # Stop the bot (Ctrl+C or kill process)
   npm run dev
   ```

## If You Registered Your Own Channel

The token is stored in the database for your channel. The bot will use its own token (BOT_ACCESS_TOKEN) to send messages.

## Verify Token Has chat:write Scope

Run:
```bash
node verify-token.js
```

You should see `chat:write` in the scopes list.

## Test Sending Messages

Run:
```bash
node test-send-message.js
```

Should succeed (no 403 errors).

## Next Steps

1. Make bot a moderator: `/mod CrossTalkBot` in your chat
2. Connect bot to channel: Already done via API
3. Test: Type `!setupchat` in your chat
