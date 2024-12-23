import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  EmbedBuilder,
  AuditLogEvent,
} from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";
import handleServerLogs from "../../events/serverEvents/handleServerLogs.js";

export default {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unbans a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to unban")
        .setRequired(true)
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1]),

  async execute(interaction) {
    if (!interaction.member.permissions.has([PermissionFlagsBits.BanMembers])) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const user = interaction.options.getUser("user");

    try {
      const guild = interaction.guild;
      await guild.members.unban(user);

      let userData = await getUser(user.id, guild.id);
      let bans = userData?.bans || [];

      bans.push({
        reason: "Unbanned",
        by: interaction.user.id,
        createdAt: Date.now(),
        type: "unban",
      });

      if (!userData) {
        await createUser(user.id, guild.id, { bans });
      } else {
        await updateUserLogs(user.id, guild.id, "bans", bans);
      }

      await handleServerLogs(
        interaction.client,
        interaction.guild,
        AuditLogEvent.MemberBanRemove,
        {
          target: user,
          executor: interaction.user,
          reason: "Ban removed",
        }
      );

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Unbanned <@${user.id}>`);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at unban.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to unban user: ${error.message}`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has([PermissionFlagsBits.BanMembers])) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return message.reply({ embeds: [embed] });
    }

    const userId = args[0]?.replace(/[<@!>]/g, "");
    if (!userId) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Please provide a user ID to unban");
      return message.reply({ embeds: [embed] });
    }

    try {
      const user = await message.client.users.fetch(userId);
      const guild = message.guild;
      await guild.members.unban(user);

      let userData = await getUser(user.id, guild.id);
      let bans = userData?.bans || [];

      bans.push({
        reason: "Unbanned",
        by: message.author.id,
        createdAt: Date.now(),
        type: "unban",
      });

      if (!userData) {
        await createUser(user.id, guild.id, { bans });
      } else {
        await updateUserLogs(user.id, guild.id, "bans", bans);
      }

      await handleServerLogs(
        message.client,
        message.guild,
        AuditLogEvent.MemberBanRemove,
        {
          target: user,
          executor: message.author,
          reason: "Ban removed",
        }
      );

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Unbanned <@${user.id}>`);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at unban.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to unban user: ${error.message}`);
      await message.reply({ embeds: [embed] });
    }
  },
};
