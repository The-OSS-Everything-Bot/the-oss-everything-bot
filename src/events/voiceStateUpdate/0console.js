/**
 * @param {import("discord.js").Client} client
 */
export default (client, interaction) => {
  const user = client.guilds.cache
    .get(interaction.guild.id)
    .members.cache.get(interaction.id).user;
  const channelId = interaction.channelId;

  console.log(
    `[info] ${user.tag} joined ${client.channels.cache.get(channelId).name}`
  );
};
