import { SlashCommandBuilder } from "discord.js";
import { getGuildDB } from "../../utils/dbManager.js";

export default {
  data: new SlashCommandBuilder()
    .setName("prefix")
    .setDescription("Changes your command prefix")
    .addStringOption((option) =>
      option
        .setName("prefix")
        .setDescription("The new prefix to use")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(3)
    )
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    try {
      const prefix = interaction.options.getString("prefix");
      const guildDB = await getGuildDB(interaction.guildId);

      await guildDB.execute({
        sql: `INSERT INTO user_settings (guild_id, user_id, prefix) 
              VALUES (?, ?, ?)
              ON CONFLICT (guild_id, user_id) 
              DO UPDATE SET prefix = ?, updated_at = strftime('%s', 'now')`,
        args: [interaction.guildId, interaction.user.id, prefix, prefix],
      });

      const cacheKey = `user:${interaction.guildId}:${interaction.user.id}:prefix`;
      await global.redis.set(cacheKey, prefix);

      await interaction.reply({
        content: `Set your prefix to \`${prefix}\``,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while setting your prefix",
        ephemeral: true,
      });
    }
  },

  async prefixExecute(message, args) {
    if (!args.length) return message.reply("Please provide a new prefix");
    if (args[0].length > 3)
      return message.reply("Prefix cannot be longer than 3 characters");

    try {
      const prefix = args[0];
      const guildDB = await getGuildDB(message.guildId);

      await guildDB.execute({
        sql: `INSERT INTO user_settings (guild_id, user_id, prefix) 
              VALUES (?, ?, ?)
              ON CONFLICT (guild_id, user_id) 
              DO UPDATE SET prefix = ?, updated_at = strftime('%s', 'now')`,
        args: [message.guildId, message.author.id, prefix, prefix],
      });

      const cacheKey = `user:${message.guildId}:${message.author.id}:prefix`;
      await global.redis.set(cacheKey, prefix);

      await message.reply(`Set your prefix to \`${prefix}\``);
    } catch (error) {
      console.error(error);
      await message.reply("An error occurred while setting your prefix");
    }
  },
};
