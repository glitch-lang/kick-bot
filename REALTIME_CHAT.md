# Real-Time Chat Implementation

## Overview

The bot now uses **Pusher WebSocket** connections to listen to Kick chat in real-time. This replaces the previous polling placeholder.

## How It Works

1. **Channel Registration**: When a streamer uses `!setupchat`, the bot:
   - Fetches channel info from Kick API
   - Extracts the chatroom ID
   - Connects to Pusher WebSocket for that chatroom

2. **Pusher Connection**: 
   - Uses Kick's Pusher key: `eb1d5f283081a78b932c`
   - Connects to: `wss://ws-us2.pusher.app/app/{key}`
   - Subscribes to channel: `chatrooms.{chatroomId}`

3. **Message Handling**:
   - Listens for `App\\Events\\ChatMessageEvent` events
   - Parses incoming messages
   - Routes to bot command handlers

4. **Fallback**: If Pusher connection fails, falls back to polling

## Setup Requirements

### Bot Account Setup

1. **Create Bot Account**:
   - Create a dedicated Kick account for the bot
   - Username should be memorable (e.g., `CrossStreamBot`)

2. **Get Access Token**:
   - Use OAuth flow to get access token for bot account
   - Token needs `chat:write` scope
   - Add to `.env`: `BOT_ACCESS_TOKEN=your_token_here`

3. **Add Bot Username**:
   - Add to `.env`: `BOT_USERNAME=your_bot_username`

### Channel Setup

Streamers can add the bot in two ways:

**Method 1: Chat Command (Recommended)**
1. Bot joins channel (or is invited)
2. Streamer types: `!setupchat`
3. Bot automatically connects via Pusher

**Method 2: Manual Invite**
1. Streamer adds bot as moderator/bot in channel settings
2. Streamer types: `!setupchat`
3. Bot connects and registers

## Technical Details

### Pusher Protocol

Kick uses Pusher protocol version 7:
- Connection URL: `wss://ws-us2.pusher.app/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.4.0&flash=false`
- Subscribe message: `{"event": "pusher:subscribe", "data": {"channel": "chatrooms.{id}"}}`
- Chat events: `App\\Events\\ChatMessageEvent`

### Message Format

Incoming chat messages are parsed into `KickChatMessage`:
```typescript
{
  id: string;
  content: string;
  type: 'message' | 'reply';
  user: {
    id: number;
    username: string;
    slug: string;
  };
  channel: {
    id: number;
    slug: string;
  };
  created_at: string;
}
```

### Connection Management

- Each channel gets its own WebSocket connection
- Connections auto-reconnect on disconnect
- Connections stored in `pusherConnections` Map
- Listeners stored in `chatListeners` Map

## Troubleshooting

### Bot Not Receiving Messages

1. **Check Connection**:
   - Look for "Pusher WebSocket connected" in logs
   - Check for "Subscribed to chatroom" message

2. **Verify Chatroom ID**:
   - Bot logs chatroom ID when connecting
   - Ensure channel info endpoint returns chatroom_id

3. **Check Bot Token**:
   - Verify `BOT_ACCESS_TOKEN` is set
   - Token must have `chat:write` permission

### Connection Errors

- **"Could not get channel info"**: Channel slug may be incorrect
- **"No chatroom ID found"**: Channel may not exist or API changed
- **WebSocket errors**: Check network/firewall, Pusher may be blocked

### Fallback to Polling

If Pusher fails, bot falls back to polling:
- Messages still processed via `/api/chat/message` endpoint
- Less efficient but functional
- Check logs for "using polling fallback" message

## Testing

1. **Start Bot**: `npm start`
2. **Register Channel**: Use `!setupchat` in chat
3. **Check Logs**: Should see Pusher connection messages
4. **Send Test Message**: Type `!streamers` in chat
5. **Verify Response**: Bot should respond in real-time

## Future Improvements

- [ ] Implement Pusher authentication (if required)
- [ ] Add connection health monitoring
- [ ] Implement message queuing for offline channels
- [ ] Add metrics for connection success/failure rates
- [ ] Support multiple Pusher clusters for redundancy
