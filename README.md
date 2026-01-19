# Kick Cross-Streamer Bot

A bot that enables cross-streamer messaging on Kick.com using chat commands and channel points integration.

## Features

- **Cross-Streamer Messaging**: Viewers can send messages to other streamers using commands like `!jerzy`
- **Online Status Check**: Use `!online` to see which streamers are currently live
- **Automatic Refunds**: If a target streamer is offline, channel points are automatically refunded
- **Response System**: Streamers can respond to messages using `!respond <id> <message>`
- **Channel Points Integration**: Commands require channel points to prevent spam
- **Cooldown System**: Built-in cooldowns to limit command usage
- **Web Dashboard**: Easy registration and command management interface
- **Community Display**: See all participating streamers

## Prerequisites

- Node.js 18+ and npm
- A Kick.com developer account (for bot administrator only)
- SQLite3 (included with Node.js)

## Setup

1. **Clone or download this repository**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Kick Developer App (Administrator Only):**
   - Go to [Kick Developer Portal](https://dev.kick.com)
   - Create a new application
   - Note your Client ID and Client Secret
   - Set redirect URI to: `http://localhost:3000/auth/kick/callback` (or your production URL)
   - **Note:** End users don't need to create their own apps - they'll authorize through your app

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in:
   - `KICK_CLIENT_ID`: Your Kick app client ID
   - `KICK_CLIENT_SECRET`: Your Kick app client secret
   - `KICK_REDIRECT_URI`: Your redirect URI (default: `http://localhost:3000/auth/kick/callback`)
   - `JWT_SECRET`: A random secret string for JWT tokens
   - `PORT`: Server port (default: 3000)

5. **Build the project:**
   ```bash
   npm run build
   ```

6. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

7. **Access the web interface:**
   Open your browser to `http://localhost:3000`

## Usage

### For Streamers

1. **Register Your Channel:**
   - Go to the "Register" tab
   - Click "Connect with Kick"
   - You'll be redirected to Kick.com to authorize the bot
   - Click "Authorize" or "Allow" to grant permissions
   - You'll be redirected back to your dashboard
   - **Note:** You don't need to create your own Kick Developer App - you're just authorizing the bot's app

2. **Create Commands:**
   - In your dashboard, click "Create New Command"
   - Enter a command name (e.g., "jerzy")
   - Select the target streamer
   - Set channel points cost and cooldown
   - Save the command

3. **Set Up Channel Points Reward:**
   - Go to your Kick dashboard
   - Navigate to Channel Points settings
   - Create a custom reward that matches your command
   - Set the cost to match your command's channel points cost
   - Enable "Require text input" if you want users to enter a message

4. **Respond to Messages:**
   - When you receive a message, you'll see it in your dashboard
   - Use `!respond <id> <message>` in your chat to reply
   - The response will be sent back to the original sender

### For Viewers

1. **Check Who's Online:**
   - Type `!online` in chat to see which streamers are currently live
   - Shows viewer counts and stream titles for online streamers
   - Lists offline streamers separately

2. **Send a Message:**
   - Redeem the channel points reward in the streamer's channel
   - Or type `!<command> <message>` in chat (if reward redemption is not required)
   - Example: `!jerzy Hey Jerzy, great stream!`
   - **Note**: If the target streamer is offline, your points will be automatically refunded

3. **Receive Responses:**
   - Responses will appear in your original channel
   - You'll be notified when the streamer responds

## API Endpoints

- `GET /api/streamers` - Get all registered streamers
- `GET /api/streamer/:id` - Get streamer details
- `GET /api/streamer/:id/commands` - Get streamer's commands
- `POST /api/streamer/:id/commands` - Create a new command
- `GET /api/streamer/:id/requests` - Get pending message requests

## Architecture

- **Backend**: Node.js/TypeScript with Express
- **Database**: SQLite3
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Bot**: WebSocket-based chat listener (with polling fallback)

## Important Notes

### Channel Points Integration

Kick's API doesn't currently provide webhooks for channel point redemptions. The bot uses a workaround:

1. **Option 1 (Recommended)**: Streamers create a custom reward in their Kick dashboard. Viewers redeem it, and the streamer manually approves. The bot monitors for the command usage.

2. **Option 2**: The bot relies on cooldowns and manual verification. Streamers should set up their custom rewards to match the command names.

### API Limitations

- Kick's API is still evolving. Some endpoints may change.
- WebSocket connections for chat may require additional setup.
- Channel points redemption events may not be available via API yet.

### Security Considerations

- Store access tokens securely
- Use HTTPS in production
- Implement rate limiting
- Validate all user inputs
- Regularly rotate JWT secrets

## Troubleshooting

### Bot not responding to commands
- Check that the bot has proper permissions in the channel
- Verify the access token is valid
- Check server logs for errors

### OAuth not working
- Verify your redirect URI matches exactly
- Check that Client ID and Secret are correct
- Ensure your app has the required scopes

### Messages not sending
- Verify the target streamer has registered
- Check that access tokens are valid
- Review Kick API rate limits

## Development

### Project Structure

```
kick-bot/
├── src/
│   ├── server.ts      # Express server and API routes
│   ├── bot.ts         # Bot logic and command handling
│   ├── database.ts    # Database schema and queries
│   └── kick-api.ts    # Kick API client
├── public/
│   ├── index.html    # Frontend HTML
│   ├── styles.css    # Frontend styles
│   └── app.js        # Frontend JavaScript
├── data/             # Database files (created automatically)
└── dist/             # Compiled TypeScript (created on build)
```

### Adding Features

1. **New Commands**: Extend the `handleMessage` function in `bot.ts`
2. **New API Endpoints**: Add routes in `server.ts`
3. **Database Changes**: Update schema in `database.ts`

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues or questions:
- Check the [Kick Developer Documentation](https://docs.kick.com)
- Review server logs for error messages
- Ensure all environment variables are set correctly

## Future Enhancements

- Real-time WebSocket chat integration
- Channel points redemption webhook support (when available)
- Multiple bot accounts support
- Advanced moderation features
- Analytics dashboard
- Mobile app support
