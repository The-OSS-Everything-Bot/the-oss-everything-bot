import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";

export default {
  data: new SlashCommandBuilder()
    .setName("jail")
    .setDescription("Jails a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to jail")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The jail channel")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription("The duration of the jail (e.g. 1d, 2h, 3m)")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for jailing")
        .setRequired(false)
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
      const targetUser = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "Not provided";
      const duration = interaction.options.getString("duration");
      const jailChannel = interaction.options.getChannel("channel");
      const parentCategory = jailChannel.parent;

      const member = await interaction.guild.members
        .fetch(targetUser.id)
        .catch(() => null);

      if (!member) {
        return await interaction.reply({
          content: "User not found in this server",
          ephemeral: true,
        });
      }

      if (member.roles.cache.some((role) => role.name === "Jailed")) {
        return await interaction.reply({
          content: `Unable to jail ${member} as they are currently jailed`,
          ephemeral: true,
        });
      }

      let jailRole = interaction.guild.roles.cache.find(
        (role) => role.name === "Jailed"
      );

      if (!jailRole) {
        jailRole = await interaction.guild.roles.create({
          name: "Jailed",
          color: "#36393f",
          permissions: [],
        });
      }

      const userRoles = member.roles.cache.filter(
        (role) => role.id !== interaction.guild.id
      );
      const removedRoles = [];

      for (const [id, role] of userRoles) {
        removedRoles.push(role.id);
        await member.roles.remove(role);
      }

      await member.roles.add(jailRole);

      for (const [id, channel] of interaction.guild.channels.cache) {
        if (channel.id === jailChannel.id) {
          await channel.permissionOverwrites.create(jailRole, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });
        } else if (channel.id === parentCategory?.id) {
          await channel.permissionOverwrites.create(jailRole, {
            ViewChannel: true,
          });
        } else {
          await channel.permissionOverwrites.create(jailRole, {
            ViewChannel: false,
          });
        }
      }

      let userData = await getUser(targetUser.id, interaction.guildId);
      let jails = userData?.jails || [];

      jails.push({
        reason,
        duration: duration || "Permanent",
        by: interaction.user.id,
        createdAt: Date.now(),
        removedRoles,
      });

      if (!userData) {
        await createUser(targetUser.id, interaction.guildId, { jails });
      } else {
        await updateUserLogs(
          targetUser.id,
          interaction.guildId,
          "jails",
          jails
        );
      }

      await interaction.reply(`Jailed ${member}`);

      if (duration) {
        const time = duration
          .replace("d", " * 24 * 60 * 60 * 1000")
          .replace("h", " * 60 * 60 * 1000")
          .replace("m", " * 60 * 1000")
          .replace("s", " * 1000");

        setTimeout(async () => {
          const currentMember = await interaction.guild.members
            .fetch(targetUser.id)
            .catch(() => null);
          if (currentMember) {
            await currentMember.roles.remove(jailRole);
            for (const roleId of removedRoles) {
              await currentMember.roles.add(roleId).catch(() => null);
            }
          }
        }, eval(time));
      }
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at jail.js`);
      await interaction.reply({
        content: "An error occurred while trying to jail the user",
        ephemeral: true,
      });
    }
  },
};
