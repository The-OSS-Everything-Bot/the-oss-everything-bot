import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { getGuildDB } from "../../utils/dbManager.js";

export default {
  data: new SlashCommandBuilder()
    .setName("setlogs")
    .setDescription("Sets the logging channel")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to send logs to")
        .setRequired(true)
    )
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has([PermissionFlagsBits.ManageGuild])
    ) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      const channel = interaction.options.getChannel("channel");
      const guildDB = await getGuildDB(interaction.guildId);

      await guildDB.execute({
        sql: `INSERT INTO guild_settings (guild_id, log_channel_id) 
              VALUES (?, ?)
              ON CONFLICT (guild_id) 
              DO UPDATE SET log_channel_id = ?, updated_at = strftime('%s', 'now')`,
        args: [interaction.guildId, channel.id, channel.id],
      });

      const cacheKey = `guild:${interaction.guildId}:settings`;
      await global.redis.set(
        cacheKey,
        JSON.stringify({ log_channel_id: channel.id })
      );

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Successfully set logging channel to ${channel}`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at setlogs.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to set logging channel: ${error.message}`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has([PermissionFlagsBits.ManageGuild])) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return message.reply({ embeds: [embed] });
    }

    if (!args.length) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Please provide a channel");
      return message.reply({ embeds: [embed] });
    }

    try {
      const channelId = args[0].replace(/[<#>]/g, "");
      const channel = message.guild.channels.cache.get(channelId);

      if (!channel) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("Invalid channel provided");
        return message.reply({ embeds: [embed] });
      }

      const guildDB = await getGuildDB(message.guildId);

      await guildDB.execute({
        sql: `INSERT INTO guild_settings (guild_id, log_channel_id) 
              VALUES (?, ?)
              ON CONFLICT (guild_id) 
              DO UPDATE SET log_channel_id = ?, updated_at = strftime('%s', 'now')`,
        args: [message.guildId, channel.id, channel.id],
      });

      const cacheKey = `guild:${message.guildId}:settings`;
      await global.redis.set(
        cacheKey,
        JSON.stringify({ log_channel_id: channel.id })
      );

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Successfully set logging channel to ${channel}`);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at setlogs.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to set logging channel: ${error.message}`);
      await message.reply({ embeds: [embed] });
    }
  },
};
