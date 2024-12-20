import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
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
    ),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has([PermissionFlagsBits.ManageGuild])
    ) {
      return await interaction.reply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });
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

      await interaction.reply({
        content: `Set logging channel to ${channel}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while setting the logging channel",
        ephemeral: true,
      });
    }
  },
};
