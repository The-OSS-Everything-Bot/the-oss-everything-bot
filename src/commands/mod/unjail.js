import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getUser, updateUserLogs } from "../../schemas/user.js";
import handleServerLogs from "../../events/serverEvents/handleServerLogs.js";

export default {
  data: new SlashCommandBuilder()
    .setName("unjail")
    .setDescription("Removes a user from jail")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to unjail")
        .setRequired(true)
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1]),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has([PermissionFlagsBits.ModerateMembers])
    ) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      const user = interaction.options.getUser("user");
      const member = await interaction.guild.members.fetch(user.id);

      if (!member) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(`Could not find user <@${user.id}> in this server`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const jailRole = interaction.guild.roles.cache.find(
        (role) => role.name === "Jailed"
      );
      if (!jailRole) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("Jail role not found in this server");
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (!member.roles.cache.has(jailRole.id)) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("This user is not jailed");
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const userData = await getUser(user.id, interaction.guildId);
      if (!userData?.jails?.length) {
        console.error(
          "\x1b[31m",
          `[Warning] User ${user.id} has jail role but no jail records`
        );
      }

      const lastJail = userData.jails[userData.jails.length - 1];

      await member.roles.remove(jailRole);
      for (const roleId of lastJail.removedRoles) {
        await member.roles.add(roleId).catch(() => null);
      }

      let jails = userData.jails || [];
      jails.push({
        reason: "Jail removed",
        by: interaction.user.id,
        createdAt: Date.now(),
        type: "unjail",
      });

      await updateUserLogs(user.id, interaction.guildId, "jails", jails);

      await handleServerLogs(
        interaction.client,
        interaction.guild,
        "COMMAND_JAIL",
        {
          target: user,
          executor: interaction.user,
          reason: "Jail removed",
          type: "unjail",
        }
      );

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Removed <@${user.id}> from jail`);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at unjail.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to unjail user: ${error.message}`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  async prefixExecute(message, args) {
    if (
      !message.member.permissions.has([PermissionFlagsBits.ModerateMembers])
    ) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return message.reply({ embeds: [embed] });
    }

    if (!args.length) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Please provide a user");
      return message.reply({ embeds: [embed] });
    }

    const userId = args[0].replace(/[<@!>]/g, "");

    try {
      const member = await message.guild.members
        .fetch(userId)
        .catch(() => null);
      if (!member) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(
            `Could not find user with ID ${userId} in this server`
          );
        return message.reply({ embeds: [embed] });
      }

      const jailRole = message.guild.roles.cache.find(
        (role) => role.name === "Jailed"
      );
      if (!jailRole) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("Jail role not found in this server");
        return message.reply({ embeds: [embed] });
      }

      if (!member.roles.cache.has(jailRole.id)) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("This user is not jailed");
        return message.reply({ embeds: [embed] });
      }

      const userData = await getUser(userId, message.guildId);
      if (!userData?.jails?.length) {
        console.error(
          "\x1b[31m",
          `[Warning] User ${userId} has jail role but no jail records`
        );
      }

      const lastJail = userData.jails[userData.jails.length - 1];

      await member.roles.remove(jailRole);
      for (const roleId of lastJail.removedRoles) {
        await member.roles.add(roleId).catch(() => null);
      }

      let jails = userData.jails || [];
      jails.push({
        reason: "Jail removed",
        by: message.author.id,
        createdAt: Date.now(),
        type: "unjail",
      });

      await updateUserLogs(userId, message.guildId, "jails", jails);

      await handleServerLogs(message.client, message.guild, "COMMAND_JAIL", {
        target: member.user,
        executor: message.author,
        reason: "Jail removed",
        type: "unjail",
      });

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Removed <@${userId}> from jail`);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at unjail.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to unjail user: ${error.message}`);
      await message.reply({ embeds: [embed] });
    }
  },
};
