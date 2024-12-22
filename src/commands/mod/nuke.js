import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import handleServerLogs from "../../events/serverEvents/handleServerLogs.js";

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
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return interaction.reply({ embeds: [embed], ephemeral: true });
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
      await handleServerLogs(
        interaction.client,
        interaction.guild,
        "COMMAND_NUKE",
        {
          target: channel,
          executor: interaction.user,
          count: 0,
          reason: "Channel nuked via command",
        }
      );
      await newChannel.send(
        "https://media1.tenor.com/m/kswttEEUhMQAAAAd/suma.gif"
      );
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at nuke.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to nuke channel: ${error.message}`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  async prefixExecute(message) {
    if (!message.member.permissions.has([PermissionFlagsBits.ManageChannels])) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return message.reply({ embeds: [embed] });
    }

    const channel = message.channel;
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
      await handleServerLogs(message.client, message.guild, "COMMAND_NUKE", {
        target: channel,
        executor: message.author,
        count: 0,
        reason: "Channel nuked via command",
      });
      await newChannel.send(
        "https://media1.tenor.com/m/kswttEEUhMQAAAAd/suma.gif"
      );
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at nuke.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to nuke channel: ${error.message}`);
      await message.channel.send({ embeds: [embed] });
    }
  },
};
