import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getGuildDB } from "../../utils/dbManager.js";

export default {
  data: new SlashCommandBuilder()
    .setName("antiraid")
    .setDescription("Configure anti-raid protection")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("toggle")
        .setDescription("Toggle anti-raid protection")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("Enable or disable anti-raid protection")
            .setRequired(true)
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel to jail raiders in")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("threshold")
        .setDescription("Set message threshold for raid detection")
        .addIntegerOption((option) =>
          option
            .setName("messages")
            .setDescription("Number of messages within timeframe to trigger")
            .setRequired(true)
            .setMinValue(3)
            .setMaxValue(20)
        )
        .addIntegerOption((option) =>
          option
            .setName("seconds")
            .setDescription("Timeframe in seconds")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(60)
        )
    ),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has([PermissionFlagsBits.ManageGuild])
    ) {
      return interaction.reply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });
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

        return interaction.reply({
          content: `Anti-raid protection has been ${enabled ? "enabled" : "disabled"} with jail channel set to ${channel}`,
          ephemeral: true,
        });
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

        return interaction.reply({
          content: `Anti-raid threshold set to ${messages} messages within ${seconds} seconds`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: "An error occurred while configuring anti-raid protection",
        ephemeral: true,
      });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has([PermissionFlagsBits.ManageGuild])) {
      return message.reply("You don't have permission to use this command");
    }

    const subcommand = args[0]?.toLowerCase();
    const guildDB = await getGuildDB(message.guildId);

    try {
      if (subcommand === "toggle") {
        const enabled =
          args[1]?.toLowerCase() === "true" || args[1]?.toLowerCase() === "on";
        const channelId = args[2]?.replace(/[<#>]/g, "");

        if (!channelId) {
          return message.reply("Please provide a channel for jail");
        }

        const channel = message.guild.channels.cache.get(channelId);
        if (!channel) {
          return message.reply("Invalid channel");
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

        return message.reply(
          `Anti-raid protection has been ${enabled ? "enabled" : "disabled"} with jail channel set to ${channel}`
        );
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
          return message.reply(
            "Please provide valid threshold values (messages: 3-20, seconds: 1-60)"
          );
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

        return message.reply(
          `Anti-raid threshold set to ${messages} messages within ${seconds} seconds`
        );
      }

      return message.reply(
        "Please provide a valid subcommand (toggle/channel/threshold)"
      );
    } catch (error) {
      console.error(error);
      return message.reply(
        "An error occurred while configuring anti-raid protection"
      );
    }
  },
};
