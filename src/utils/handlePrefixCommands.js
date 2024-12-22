import { EmbedBuilder } from "discord.js";
import getLocalCommands from "./getLocalCommands.js";
import { getGuildDB, getUserPrefix } from "./dbManager.js";

export default async (client, message) => {
  if (message.author.bot) return;

  let prefix = "%";

  const userPrefix = await getUserPrefix(message.author.id, message.guildId);
  if (userPrefix) {
    prefix = userPrefix;
  } else {
    const cacheKey = `guild:${message.guildId}:settings`;
    const cachedSettings = await global.redis.get(cacheKey);

    if (cachedSettings) {
      const settings = JSON.parse(cachedSettings);
      if (settings.prefix) prefix = settings.prefix;
    } else {
      const guildDB = await getGuildDB(message.guildId);
      const result = await guildDB.execute({
        sql: "SELECT prefix FROM guild_settings WHERE guild_id = ?",
        args: [message.guildId],
      });

      const settings = result.rows[0];
      if (settings?.prefix) {
        prefix = settings.prefix;
        await global.redis.set(cacheKey, JSON.stringify({ prefix }));
      }
    }
  }

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  let commandName = args.shift().toLowerCase();

  const aliasCacheKey = `user:${message.guildId}:${message.author.id}:aliases`;
  const cachedAliases = await global.redis.get(aliasCacheKey);
  let aliases = {};

  if (cachedAliases) {
    aliases = JSON.parse(cachedAliases);
  } else {
    const guildDB = await getGuildDB(message.guildId);
    const result = await guildDB.execute({
      sql: "SELECT aliases FROM user_settings WHERE guild_id = ? AND user_id = ?",
      args: [message.guildId, message.author.id],
    });

    if (result.rows[0]?.aliases) {
      aliases = JSON.parse(result.rows[0].aliases);
      await global.redis.set(aliasCacheKey, JSON.stringify(aliases));
    }
  }

  if (aliases[commandName]) {
    commandName = aliases[commandName];
  }

  const commands = await getLocalCommands();
  const command = commands.find((cmd) => cmd.data.name === commandName);

  if (!command || !command.prefixExecute) {
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setDescription("Command not found")
      .setFooter({ text: `Use ${prefix}help to see all commands` });
    return message.reply({ embeds: [embed] });
  }

  const hasRequiredOptions = command.data.options?.some((opt) => opt.required);
  if (hasRequiredOptions && !args.length) {
    const options = command.data.options;
    const usage = options
      .map((opt) => (opt.required ? `<${opt.name}>` : `[${opt.name}]`))
      .join(" ");

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("Command Usage")
      .setDescription(`\`${prefix}${command.data.name} ${usage}\``)
      .addFields({
        name: "Description",
        value: command.data.description,
      });

    if (options.length) {
      const optionsField = options
        .map((opt) => `\`${opt.name}\` - ${opt.description}`)
        .join("\n");
      embed.addFields({ name: "Options", value: optionsField });
    }

    return message.reply({ embeds: [embed] });
  }

  try {
    await command.prefixExecute(message, args, client);
  } catch (error) {
    console.error(error);
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setDescription("An error occurred while executing this command!");
    await message.reply({ embeds: [embed] });
  }
};
