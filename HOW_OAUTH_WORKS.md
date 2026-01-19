# How OAuth Works for Streamers

## Short Answer: Streamers DON'T Need Their Own Apps! ✅

Streamers only need to **authorize your app** - they don't need to create their own Kick Developer applications.

## How It Works:

### Administrator Setup (You - One Time):
1. ✅ You create **ONE** Kick Developer App at dev.kick.com
2. ✅ You set the Client ID and Secret in `.env` file
3. ✅ That's it - you're done!

### Streamer Registration (Each Streamer):
1. Streamer goes to your bot's website
2. Streamer clicks "Connect with Kick"
3. Streamer is redirected to Kick.com
4. Kick shows: "Do you want to authorize [Your App Name] to access your account?"
5. Streamer clicks "Authorize" or "Allow"
6. Kick redirects back to your server with an authorization code
7. Your server exchanges the code for an **access token** for that streamer
8. The token is stored in your database
9. Your bot can now send messages on behalf of that streamer

## What Happens Behind the Scenes:

```
┌─────────────┐
│  Streamer   │ Clicks "Connect with Kick"
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Your Server (localhost:3000)      │
│  Uses YOUR Client ID                │
│  Redirects to Kick OAuth           │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Kick.com OAuth Page                │
│  Shows: "Authorize [Your App]?"     │
│  Streamer clicks "Allow"            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Kick redirects back with CODE      │
│  to: localhost:3000/auth/kick/      │
│      callback?code=ABC123...        │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Your Server exchanges CODE        │
│  for ACCESS TOKEN using:            │
│  - YOUR Client ID                   │
│  - YOUR Client Secret               │
│  - CODE from Kick                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Access Token stored in database    │
│  Associated with that streamer's    │
│  Kick account                        │
└──────────────────────────────────────┘
```

## Key Points:

- ✅ **One App**: You create ONE Kick Developer App
- ✅ **Multiple Streamers**: Many streamers can authorize through your app
- ✅ **Separate Tokens**: Each streamer gets their own access token
- ✅ **No Setup Required**: Streamers just click "Connect" and authorize
- ✅ **Your Credentials**: Only YOUR Client ID/Secret are used (stored in .env)

## What Each Streamer Gets:

When a streamer authorizes your app, they grant YOUR app permission to:
- Read their user information
- Send messages in their chat (on their behalf)
- Read their channel information
- Check their channel points
- Subscribe to events in their channel

But they're authorizing **YOUR app** - not creating their own app.

## Example Flow:

1. **You** create app "Cross-Streamer Bot" at dev.kick.com
2. **Streamer A** clicks "Connect with Kick" → Authorizes YOUR app → Gets token A
3. **Streamer B** clicks "Connect with Kick" → Authorizes YOUR app → Gets token B
4. **Streamer C** clicks "Connect with Kick" → Authorizes YOUR app → Gets token C

All three streamers authorized the same app (yours), but each has their own access token stored in your database.

## Security:

- ✅ Streamers never see your Client Secret
- ✅ Each streamer's token is stored separately
- ✅ Tokens are scoped to what you requested (chat:write, etc.)
- ✅ Streamers can revoke access anytime in their Kick settings

## Summary:

**Streamers = Just click "Connect" and authorize**
**You = Create one app, set credentials once**

That's it! Simple for streamers, one-time setup for you.
