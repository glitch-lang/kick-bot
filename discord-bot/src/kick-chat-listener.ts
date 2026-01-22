import axios from 'axios';
import Pusher from 'pusher-js';

interface KickChatMessage {
  id: string;
  chatroom_id: number;
  content: string;
  type: string;
  created_at: string;
  sender: {
    id: number;
    username: string;
    slug: string;
    identity: {
      color?: string;
      badges?: Array<{
        type: string;
        text: string;
      }>;
    };
  };
}

export class KickChatListener {
  private pusher: Pusher | null = null;
  private channel: any = null;
  private chatroomId: number | null = null;
  private streamerName: string;
  private onMessageCallback: ((username: string, message: string) => void) | null = null;

  constructor(streamerName: string) {
    this.streamerName = streamerName.toLowerCase();
  }

  async connect(onMessage: (username: string, message: string) => void): Promise<boolean> {
    try {
      this.onMessageCallback = onMessage;

      // Get chatroom ID from Kick API
      console.log(`🔌 Connecting to Kick chat for ${this.streamerName}...`);
      const response = await axios.get(`https://kick.com/api/v2/channels/${this.streamerName}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://kick.com/',
          'Origin': 'https://kick.com'
        }
      });
      const channelData = response.data;

      if (!channelData.chatroom) {
        console.error(`❌ No chatroom found for ${this.streamerName}`);
        return false;
      }

      this.chatroomId = channelData.chatroom.id;
      console.log(`✅ Found chatroom ID: ${this.chatroomId}`);

      // Connect to Pusher (Kick uses Pusher for real-time chat)
      this.pusher = new Pusher('eb1d5f283081a78b932c', {
        cluster: 'us2',
        wsHost: 'ws-us2.pusher.com',
        wsPort: 443,
        wssPort: 443,
        enabledTransports: ['ws', 'wss'],
        forceTLS: true,
        disableStats: true,
      });

      // Subscribe to chatroom channel
      const channelName = `chatrooms.${this.chatroomId}.v2`;
      this.channel = this.pusher.subscribe(channelName);

      console.log(`📡 Subscribed to Kick chat: ${channelName}`);

      // Listen for messages
      this.channel.bind('App\\Events\\ChatMessageEvent', (data: KickChatMessage) => {
        this.handleMessage(data);
      });

      // Listen for connection events
      this.pusher.connection.bind('connected', () => {
        console.log(`✅ Connected to Kick chat for ${this.streamerName}`);
      });

      this.pusher.connection.bind('error', (error: any) => {
        console.error(`❌ Kick chat connection error:`, error);
      });

      return true;

    } catch (error: any) {
      console.error(`❌ Failed to connect to Kick chat for ${this.streamerName}:`, error.message);
      return false;
    }
  }

  private handleMessage(data: KickChatMessage) {
    try {
      // Only process regular chat messages
      if (data.type !== 'message') return;

      const username = data.sender.username;
      const message = data.content;

      // Filter out bot messages and system messages
      if (username.toLowerCase().includes('bot')) return;
      if (message.startsWith('[Watch Party]')) return; // Don't echo our own messages

      // Call the callback with the message
      if (this.onMessageCallback) {
        this.onMessageCallback(username, message);
      }

      console.log(`💬 Kick chat: ${username}: ${message}`);

    } catch (error) {
      console.error('Error handling Kick chat message:', error);
    }
  }

  disconnect() {
    try {
      if (this.channel) {
        this.channel.unbind_all();
        this.pusher?.unsubscribe(`chatrooms.${this.chatroomId}.v2`);
      }

      if (this.pusher) {
        this.pusher.disconnect();
      }

      console.log(`🔌 Disconnected from Kick chat for ${this.streamerName}`);
    } catch (error) {
      console.error('Error disconnecting from Kick chat:', error);
    }
  }

  isConnected(): boolean {
    return this.pusher?.connection.state === 'connected';
  }

  getStreamerName(): string {
    return this.streamerName;
  }
}
