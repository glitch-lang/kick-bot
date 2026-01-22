import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  InviteTargetType,
  ChannelType,
  PermissionFlagsBits 
} from 'discord.js';
import type { WatchPartyServer } from './watch-party-server';

export class ActivityLauncher {
  private watchPartyServer: WatchPartyServer;
  private activityId: string;

  constructor(watchPartyServer: WatchPartyServer, activityId: string) {
    this.watchPartyServer = watchPartyServer;
    this.activityId = activityId;
    
    console.log(`🎮 Activity Launcher initialized with ID: ${activityId}`);
  }

  /**
   * Creates slash command for launching watch party activity
   */
  getSlashCommand() {
    return new SlashCommandBuilder()
      .setName('activity')
      .setDescription('Start a Kick watch party as a Discord Activity')
      .addStringOption(option =>
        option
          .setName('streamer')
          .setDescription('Kick streamer username to watch')
          .setRequired(true)
      )
      .addBooleanOption(option =>
        option
          .setName('relay')
          .setDescription('Relay Discord messages to Kick chat')
          .setRequired(false)
      )
      .addBooleanOption(option =>
        option
          .setName('twoway')
          .setDescription('Enable two-way chat (show Kick messages in Discord)')
          .setRequired(false)
      );
  }

  /**
   * Handles the /activity command
   */
  async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      // Defer reply immediately
      await interaction.deferReply({ ephemeral: true });

      const streamerName = interaction.options.get('streamer')?.value as string;
      const relayToKick = interaction.options.get('relay')?.value as boolean ?? false;
      const twoWayChat = interaction.options.get('twoway')?.value as boolean ?? true;

      if (!streamerName) {
        await interaction.editReply({
          content: '❌ Please provide a streamer username!'
        });
        return;
      }

      // Check if user is in a voice channel
      const member = interaction.guild?.members.cache.get(interaction.user.id);
      const voiceChannel = member?.voice.channel;

      if (!voiceChannel) {
        await interaction.editReply({
          content: '❌ You must be in a voice channel to start an Activity!'
        });
        return;
      }

      // Check if bot has permission to create invites
      if (!voiceChannel.permissionsFor(interaction.guild?.members.me!)?.has(PermissionFlagsBits.CreateInstantInvite)) {
        await interaction.editReply({
          content: '❌ I need the "Create Invite" permission in this voice channel!'
        });
        return;
      }

      console.log(`🎬 Creating watch party for ${streamerName} in ${interaction.guild?.name}`);

      // Create watch party for Discord Activity
      // isActivity: true = Kick player loads client-side, no server-side Kick API calls
      const partyId = this.watchPartyServer.createWatchParty(
        streamerName,
        interaction.guildId!,
        interaction.guild?.name || 'Unknown Server',
        relayToKick,
        twoWayChat,
        true // isActivity - skip server-side Kick connection
      );

      console.log(`✅ Watch party created: ${partyId}`);

      // Create Activity invite
      try {
        // For Stage Channels, we need to handle differently
        if (voiceChannel.type === ChannelType.GuildStageVoice) {
          await interaction.editReply({
            content: '⚠️ Activities are not supported in Stage Channels. Please use a regular Voice Channel.'
          });
          return;
        }

        // Create invite with Activity target
        const invite = await voiceChannel.createInvite({
          targetType: InviteTargetType.EmbeddedApplication,
          targetApplication: this.activityId,
          maxAge: 0, // Never expires
          maxUses: 0  // Unlimited uses
        });

        // Discord will automatically add the party ID to the Activity URL
        // We can pass it via query params for the activity to pick up
        const activityUrl = invite.url;
        const publicUrl = process.env.PUBLIC_URL || `http://localhost:${this.watchPartyServer.getPort()}`;
        const regularUrl = `${publicUrl}/party/${partyId}`;
        
        // Store party ID for the Activity to retrieve
        // Discord Activities can access query params from the URL

        await interaction.editReply({
          content: [
            `🎬 **Kick Watch Party Created!**`,
            `Streamer: **${streamerName}**`,
            ``,
            `**Option 1: Discord Activity (Recommended)**`,
            `Click the button below to open in Discord:`,
            `${activityUrl}`,
            ``,
            `**Option 2: Web Browser**`,
            `${regularUrl}`,
            ``,
            `Features:`,
            twoWayChat ? '✅ Two-way chat enabled' : '❌ Two-way chat disabled',
            relayToKick ? '✅ Relay to Kick enabled' : '❌ Relay to Kick disabled'
          ].join('\n')
        });

        console.log(`✅ Activity invite created: ${activityUrl}`);

      } catch (error: any) {
        console.error('❌ Failed to create Activity invite:', error);
        
        // Fallback to regular web link
        const regularUrl = `${process.env.PUBLIC_URL || `http://localhost:${this.watchPartyServer.getPort()}`}/party/${partyId}`;
        
        await interaction.editReply({
          content: [
            `⚠️ Could not create Discord Activity (feature may not be enabled yet).`,
            ``,
            `**Watch Party Link:**`,
            `${regularUrl}`,
            ``,
            `Streamer: **${streamerName}**`,
            twoWayChat ? '✅ Two-way chat enabled' : '❌ Two-way chat disabled',
            relayToKick ? '✅ Relay to Kick enabled' : '❌ Relay to Kick disabled'
          ].join('\n')
        });
      }

    } catch (error: any) {
      console.error('❌ Error handling /activity command:', error);
      
      if (interaction.deferred) {
        await interaction.editReply({
          content: `❌ Error: ${error.message}`
        });
      } else {
        await interaction.reply({
          content: `❌ Error: ${error.message}`,
          ephemeral: true
        });
      }
    }
  }

  /**
   * Check if Activity feature is properly configured
   */
  isConfigured(): boolean {
    return !!this.activityId && this.activityId !== 'YOUR_ACTIVITY_ID';
  }

  /**
   * Get configuration status for debugging
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      activityId: this.activityId,
      watchPartyPort: this.watchPartyServer.getPort()
    };
  }
}
