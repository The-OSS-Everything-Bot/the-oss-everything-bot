import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getGuildDB } from "../../utils/dbManager.js";

export default {
  data: new SlashCommandBuilder()
    .setName("alias")
    .setDescription("Set a command alias")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command to alias")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("alias")
        .setDescription("The alias to use")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(10)
    )
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    try {
      const command = interaction.options.getString("command");
      const alias = interaction.options.getString("alias");

      const guildDB = await getGuildDB(interaction.guildId);

      await guildDB.execute({
        sql: `INSERT INTO user_settings (guild_id, user_id, aliases) 
              VALUES (?, ?, json_object(?, ?))
              ON CONFLICT (guild_id, user_id) 
              DO UPDATE SET aliases = json_set(COALESCE(aliases, '{}'), ?, ?)`,
        args: [
          interaction.guildId,
          interaction.user.id,
          alias,
          command,
          `$.${alias}`,
          command,
        ],
      });

      const cacheKey = `user:${interaction.guildId}:${interaction.user.id}:aliases`;
      const currentAliases = JSON.parse(
        (await global.redis.get(cacheKey)) || "{}"
      );
      currentAliases[alias] = command;
      await global.redis.set(cacheKey, JSON.stringify(currentAliases));

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Set alias \`${alias}\` for command \`${command}\``);

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at alias.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to set alias: ${error.message}`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  async prefixExecute(message, args) {
    if (args.length < 2) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Please provide a command and alias");
      return message.reply({ embeds: [embed] });
    }

    const command = args[0];
    const alias = args[1];

    if (alias.length > 10) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Alias cannot be longer than 10 characters");
      return message.reply({ embeds: [embed] });
    }

    try {
      const guildDB = await getGuildDB(message.guildId);

      await guildDB.execute({
        sql: `INSERT INTO user_settings (guild_id, user_id, aliases) 
              VALUES (?, ?, json_object(?, ?))
              ON CONFLICT (guild_id, user_id) 
              DO UPDATE SET aliases = json_set(COALESCE(aliases, '{}'), ?, ?)`,
        args: [
          message.guildId,
          message.author.id,
          alias,
          command,
          `$.${alias}`,
          command,
        ],
      });

      const cacheKey = `user:${message.guildId}:${message.author.id}:aliases`;
      const currentAliases = JSON.parse(
        (await global.redis.get(cacheKey)) || "{}"
      );
      currentAliases[alias] = command;
      await global.redis.set(cacheKey, JSON.stringify(currentAliases));

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Set alias \`${alias}\` for command \`${command}\``);

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at alias.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to set alias: ${error.message}`);
      await message.reply({ embeds: [embed] });
    }
  },
};
