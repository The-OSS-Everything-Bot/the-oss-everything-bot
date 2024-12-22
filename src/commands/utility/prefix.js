import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
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

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Set your prefix to \`${prefix}\``);

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at prefix.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to set prefix: ${error.message}`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  async prefixExecute(message, args) {
    if (!args.length) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Please provide a new prefix");
      return message.reply({ embeds: [embed] });
    }

    if (args[0].length > 3) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Prefix cannot be longer than 3 characters");
      return message.reply({ embeds: [embed] });
    }

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

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Set your prefix to \`${prefix}\``);

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at prefix.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to set prefix: ${error.message}`);
      await message.reply({ embeds: [embed] });
    }
  },
};
