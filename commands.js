import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import getLocalCommands from './src/utils/getLocalCommands.js';

dotenv.config();

const commands = [];

async function getCommands() {
  const localCommands = await getLocalCommands();

  for (const localCommand of localCommands) {
    commands.push(localCommand.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    await getCommands();

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log(data)
    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();