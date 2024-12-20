import getLocalCommands from "./getLocalCommands.js";

export default async (client, message) => {
  const prefix = "%";

  if (!message.content.startsWith(prefix) || message.author.bot) return;

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
