export default async (client, guildId) => {
  let commands = [];

  // console.log(client)
  if (guildId) {
    const guild = await client.guilds.fetch(guildId);
    commands = guild.commands;
  } else {
    commands = await client.application.commands;
  }

  await commands.fetch();

  return commands;
};
