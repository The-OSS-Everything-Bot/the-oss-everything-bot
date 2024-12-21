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
      const [settings] = await guildDB.execute({
        sql: "SELECT prefix FROM guild_settings WHERE guild_id = ?",
        args: [message.guildId],
      });

      if (settings?.prefix) {
        prefix = settings.prefix;
        await global.redis.set(cacheKey, JSON.stringify({ prefix }));
      }
    }
  }

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const commands = await getLocalCommands();
  const command = commands.find((cmd) => cmd.data.name === commandName);

  if (!command || !command.prefixExecute) return;

  try {
    await command.prefixExecute(message, args, client);
  } catch (error) {
    console.error(error);
    await message.reply("An error occurred while executing this command!");
  }
};
