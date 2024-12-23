import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  AuditLogEvent,
} from "discord.js";
import handleServerLogs from "../../events/serverEvents/handleServerLogs.js";

export default {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kicks a user from the server")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to kick")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for kicking")
        .setRequired(false)
    )
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has([PermissionFlagsBits.KickMembers])
    ) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") || "No reason provided";
    const member = await interaction.guild.members.fetch(user.id);

    if (!member) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Could not find that user in this server");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (!member.kickable) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("I cannot kick this user");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      await member.kick(reason);
      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Successfully kicked <@${user.id}>`);
      await interaction.reply({ embeds: [embed] });

      await handleServerLogs(
        interaction.client,
        interaction.guild,
        AuditLogEvent.MemberKick,
        {
          target: user,
          executor: interaction.user,
          reason,
        }
      );
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at kick.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to kick user: ${error.message}`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has([PermissionFlagsBits.KickMembers])) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return message.reply({ embeds: [embed] });
    }

    const userId = args[0]?.replace(/[<@!>]/g, "");
    if (!userId) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Please provide a user to kick");
      return message.reply({ embeds: [embed] });
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      const user = await message.client.users.fetch(userId);
      const member = await message.guild.members.fetch(user.id);

      if (!member) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("Could not find that user in this server");
        return message.reply({ embeds: [embed] });
      }

      if (!member.kickable) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("I cannot kick this user");
        return message.reply({ embeds: [embed] });
      }

      await member.kick(reason);
      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Successfully kicked <@${user.id}>`);
      await message.reply({ embeds: [embed] });

      await handleServerLogs(
        message.client,
        message.guild,
        AuditLogEvent.MemberKick,
        {
          target: user,
          executor: message.author,
          reason,
        }
      );
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at kick.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to kick user: ${error.message}`);
      await message.reply({ embeds: [embed] });
    }
  },
};
