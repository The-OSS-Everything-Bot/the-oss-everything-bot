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

  try {
    const fakeInteraction = createCommandInteraction(message, args);
    await command.execute(fakeInteraction, client);
  } catch (error) {
    console.error(error);
    await message.reply("An error occurred while executing this command!");
  }
};
