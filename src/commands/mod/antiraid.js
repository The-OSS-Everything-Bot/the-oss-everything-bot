import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { getGuildDB } from "../../utils/dbManager.js";

export default {
  data: new SlashCommandBuilder()
    .setName("antiraid")
    .setDescription("Configure anti-raid protection")
    .addStringOption((option) =>
      option
        .setName("subcommand")
        .setDescription("The subcommand to execute (toggle/threshold)")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("enabled")
        .setDescription("Enable or disable anti-raid protection")
    )
    .addChannelOption((option) =>
      option.setName("channel").setDescription("Channel to jail raiders in")
    )
    .addIntegerOption((option) =>
      option
        .setName("messages")
        .setDescription("Number of messages within timeframe to trigger (3-20)")
        .setMinValue(3)
        .setMaxValue(20)
    )
    .addIntegerOption((option) =>
      option
        .setName("seconds")
        .setDescription("Timeframe in seconds (1-60)")
        .setMinValue(1)
        .setMaxValue(60)
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

    const subcommand = interaction.options.getSubcommand();
    const guildDB = await getGuildDB(interaction.guildId);

    try {
      if (subcommand === "toggle") {
        const enabled = interaction.options.getBoolean("enabled");
        const channel = interaction.options.getChannel("channel");

        await guildDB.execute({
          sql: `INSERT INTO guild_settings (guild_id, antiraid_enabled, antiraid_jail_channel) 
                VALUES (?, ?, ?)
                ON CONFLICT (guild_id) 
                DO UPDATE SET antiraid_enabled = ?, antiraid_jail_channel = ?, updated_at = strftime('%s', 'now')`,
          args: [interaction.guildId, enabled, channel.id, enabled, channel.id],
        });

        const cacheKey = `guild:${interaction.guildId}:settings`;
        const settings = JSON.parse((await global.redis.get(cacheKey)) || "{}");
        settings.antiraid_enabled = enabled;
        settings.antiraid_jail_channel = channel.id;
        await global.redis.set(cacheKey, JSON.stringify(settings));

        const embed = new EmbedBuilder()
          .setColor(0x57f287)
          .setDescription(
            `Anti-raid protection has been ${enabled ? "enabled" : "disabled"} with jail channel set to ${channel}`
          );
        return interaction.reply({ embeds: [embed] });
      }

      if (subcommand === "threshold") {
        const messages = interaction.options.getInteger("messages");
        const seconds = interaction.options.getInteger("seconds");

        await guildDB.execute({
          sql: `INSERT INTO guild_settings (guild_id, antiraid_msg_threshold, antiraid_time_window) 
                VALUES (?, ?, ?)
                ON CONFLICT (guild_id) 
                DO UPDATE SET antiraid_msg_threshold = ?, antiraid_time_window = ?, updated_at = strftime('%s', 'now')`,
          args: [interaction.guildId, messages, seconds, messages, seconds],
        });

        const cacheKey = `guild:${interaction.guildId}:settings`;
        const settings = JSON.parse((await global.redis.get(cacheKey)) || "{}");
        settings.antiraid_msg_threshold = messages;
        settings.antiraid_time_window = seconds;
        await global.redis.set(cacheKey, JSON.stringify(settings));

        const embed = new EmbedBuilder()
          .setColor(0x57f287)
          .setDescription(
            `Anti-raid threshold set to ${messages} messages within ${seconds} seconds`
          );
        return interaction.reply({ embeds: [embed] });
      }

      if (!subcommand) return;
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at antiraid.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to configure anti-raid: ${error.message}`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has([PermissionFlagsBits.ManageGuild])) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return message.reply({ embeds: [embed] });
    }

    const subcommand = args[0]?.toLowerCase();
    const guildDB = await getGuildDB(message.guildId);

    try {
      if (subcommand === "toggle") {
        const enabled =
          args[1]?.toLowerCase() === "true" || args[1]?.toLowerCase() === "on";
        const channelId = args[2]?.replace(/[<#>]/g, "");

        if (!channelId) {
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription("Please provide a channel for jail");
          return message.reply({ embeds: [embed] });
        }

        const channel = message.guild.channels.cache.get(channelId);
        if (!channel) {
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription("Invalid channel");
          return message.reply({ embeds: [embed] });
        }

        await guildDB.execute({
          sql: `INSERT INTO guild_settings (guild_id, antiraid_enabled, antiraid_jail_channel) 
                VALUES (?, ?, ?)
                ON CONFLICT (guild_id) 
                DO UPDATE SET antiraid_enabled = ?, antiraid_jail_channel = ?, updated_at = strftime('%s', 'now')`,
          args: [message.guildId, enabled, channel.id, enabled, channel.id],
        });

        const cacheKey = `guild:${message.guildId}:settings`;
        const settings = JSON.parse((await global.redis.get(cacheKey)) || "{}");
        settings.antiraid_enabled = enabled;
        settings.antiraid_jail_channel = channel.id;
        await global.redis.set(cacheKey, JSON.stringify(settings));

        const embed = new EmbedBuilder()
          .setColor(0x57f287)
          .setDescription(
            `Anti-raid protection has been ${enabled ? "enabled" : "disabled"} with jail channel set to ${channel}`
          );
        return message.reply({ embeds: [embed] });
      }

      if (subcommand === "threshold") {
        const messages = parseInt(args[1]);
        const seconds = parseInt(args[2]);

        if (
          !messages ||
          !seconds ||
          messages < 3 ||
          messages > 20 ||
          seconds < 1 ||
          seconds > 60
        ) {
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription(
              "Please provide valid threshold values (messages: 3-20, seconds: 1-60)"
            );
          return message.reply({ embeds: [embed] });
        }

        await guildDB.execute({
          sql: `INSERT INTO guild_settings (guild_id, antiraid_msg_threshold, antiraid_time_window) 
                VALUES (?, ?, ?)
                ON CONFLICT (guild_id) 
                DO UPDATE SET antiraid_msg_threshold = ?, antiraid_time_window = ?, updated_at = strftime('%s', 'now')`,
          args: [message.guildId, messages, seconds, messages, seconds],
        });

        const cacheKey = `guild:${message.guildId}:settings`;
        const settings = JSON.parse((await global.redis.get(cacheKey)) || "{}");
        settings.antiraid_msg_threshold = messages;
        settings.antiraid_time_window = seconds;
        await global.redis.set(cacheKey, JSON.stringify(settings));

        const embed = new EmbedBuilder()
          .setColor(0x57f287)
          .setDescription(
            `Anti-raid threshold set to ${messages} messages within ${seconds} seconds`
          );
        return message.reply({ embeds: [embed] });
      }

      return;
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at antiraid.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to configure anti-raid: ${error.message}`);
      return message.reply({ embeds: [embed] });
    }
  },
};
