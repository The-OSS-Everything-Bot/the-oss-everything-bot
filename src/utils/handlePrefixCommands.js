import getLocalCommands from "./getLocalCommands.js";
import { createCommandInteraction } from "./commandUtils.js";

export default async (client, message) => {
  const prefix = "%";

  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const commands = await getLocalCommands();
  const command = commands.find((cmd) => cmd.data.name === commandName);

  if (!command) return;

  const getCommandUsage = (cmd) => {
    const options = cmd.data.options;
    if (!options) return "";

    const requiredOptions = options
      .filter((opt) => opt.required)
      .map((opt) => `<${opt.name}>`)
      .join(" ");

    const optionalOptions = options
      .filter((opt) => !opt.required)
      .map((opt) => `[${opt.name}]`)
      .join(" ");

    return `${prefix}${cmd.data.name} ${requiredOptions} ${optionalOptions}`.trim();
  };

  if (args.length === 0 && command.data.options?.some((opt) => opt.required)) {
    const usage = getCommandUsage(command);
    return message.reply(`Usage: ${usage}`);
  }

  try {
    const fakeInteraction = createCommandInteraction(message, args);
    await command.execute(fakeInteraction, client);
  } catch (error) {
    console.error(error);
    await message.reply("An error occurred while executing this command!");
  }
};
