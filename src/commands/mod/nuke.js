import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("nuke")
    .setDescription("Nukes the current channel")
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has([PermissionFlagsBits.ManageChannels])
    ) {
      return await interaction.reply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });
    }

    const channel = interaction.channel;
    const position = channel.position;
    const parent = channel.parent;
    const permissions = channel.permissionOverwrites.cache;
    const topic = channel.topic;
    const nsfw = channel.nsfw;
    const rateLimitPerUser = channel.rateLimitPerUser;
    const name = channel.name;

    try {
      const newChannel = await channel.clone({
        name,
        topic,
        nsfw,
        parent,
        position,
        rateLimitPerUser,
        permissionOverwrites: [...permissions.values()],
      });

      await channel.delete();
      await newChannel.send(
        "https://media1.tenor.com/m/kswttEEUhMQAAAAd/suma.gif"
      );
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at nuke.js`);
      await interaction.reply({
        content: "An error occurred while nuking the channel",
        ephemeral: true,
      });
    }
  },
};
