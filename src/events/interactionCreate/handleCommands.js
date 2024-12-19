import getLocalCommands from "../../utils/getLocalCommands.js";

export default async (client, interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const localCommands = await getLocalCommands();
  const command = localCommands.find(
    (cmd) => cmd.data.name === interaction.commandName
  );

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
};
