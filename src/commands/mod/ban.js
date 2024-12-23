import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";
import handleServerLogs from "../../events/serverEvents/handleServerLogs.js";
import { AuditLogEvent } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bans a user")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to ban").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the ban")
        .setRequired(false)
    )
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    if (!interaction.member.permissions.has([PermissionFlagsBits.BanMembers])) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    try {
      const guild = interaction.guild;
      await guild.members.ban(user, { reason });

      let userData = await getUser(user.id, guild.id);
      let bans = userData?.bans || [];

      bans.push({
        reason,
        by: interaction.user.id,
        createdAt: Date.now(),
      });

      if (!userData) {
        await createUser(user.id, guild.id, { bans });
      } else {
        await updateUserLogs(user.id, guild.id, "bans", bans);
      }

      await handleServerLogs(
        interaction.client,
        interaction.guild,
        AuditLogEvent.MemberBanAdd,
        {
          target: user,
          executor: interaction.user,
          reason,
        }
      );

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Successfully banned <@${user.id}>`);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at ban.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to ban user: ${error.message}`);
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
        .setDescription("Please provide a user to ban");
      return message.reply({ embeds: [embed] });
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      const user = await message.client.users.fetch(userId);
      const guild = message.guild;
      await guild.members.ban(user, { reason });

      let userData = await getUser(user.id, guild.id);
      let bans = userData?.bans || [];

      bans.push({
        reason,
        by: message.author.id,
        createdAt: Date.now(),
      });

      if (!userData) {
        await createUser(user.id, guild.id, { bans });
      } else {
        await updateUserLogs(user.id, guild.id, "bans", bans);
      }

      await handleServerLogs(
        message.client,
        message.guild,
        AuditLogEvent.MemberBanAdd,
        {
          target: user,
          executor: message.author,
          reason,
        }
      );

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Successfully banned <@${user.id}>`);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at ban.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to ban user: ${error.message}`);
      await message.reply({ embeds: [embed] });
    }
  },
};
