import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";

export default {
  data: new SlashCommandBuilder()
    .setName("unjail")
    .setDescription("Unjails a user")
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
    )
      return await interaction.reply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });

    try {
      const user = interaction.options.getMember("user");
      let userData = await getUser(user.id, interaction.guildId);

      if (!userData?.jails?.length) {
        return await interaction.reply({
          content: "This user is not jailed",
          ephemeral: true,
        });
      }

      const jailRole = interaction.guild.roles.cache.find(
        (role) => role.name === "Jailed"
      );

      if (!jailRole) {
        return await interaction.reply({
          content: "Jail role not found",
          ephemeral: true,
        });
      }

      await user.roles.remove(jailRole);
      const lastJail = userData.jails[userData.jails.length - 1];

      if (lastJail.removedRoles) {
        for (const roleId of lastJail.removedRoles) {
          await user.roles.add(roleId);
        }
      }

      let jails = userData.jails || [];
      jails.push({
        reason: "Unjailed",
        by: interaction.user.id,
        createdAt: Date.now(),
        type: "unjail",
      });

      await updateUserLogs(user.id, interaction.guildId, "jails", jails);
      await interaction.reply(`Unjailed <@${user.id}>`);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while unjailing the user",
        ephemeral: true,
      });
    }
  },
};
