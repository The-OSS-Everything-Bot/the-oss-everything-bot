import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

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
      const user = interaction.options.getMember("user");

      if (user.roles.cache.some((role) => role.name === "Jailed")) {
        return await interaction.reply({
          content: `Unable to jail ${user} as they are currently jailed`,
          ephemeral: true,
        });
      }

      const jailChannel = interaction.options.getChannel("channel");
      const reason =
        interaction.options.getString("reason") || "No reason provided";
      const duration = interaction.options.getString("duration");
      const parentCategory = jailChannel.parent;

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

      const userRoles = user.roles.cache.filter(
        (role) => role.id !== interaction.guild.id
      );
      const removedRoles = [];

      for (const [id, role] of userRoles) {
        removedRoles.push(role.id);
        await user.roles.remove(role);
      }

      await user.roles.add(jailRole);

      for (const [id, channel] of interaction.guild.channels.cache) {
        if (channel.id === jailChannel.id) {
          await channel.permissionOverwrites.create(jailRole, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });
        } else if (channel.id === parentCategory.id) {
          await channel.permissionOverwrites.create(jailRole, {
            ViewChannel: true,
          });
        } else {
          await channel.permissionOverwrites.create(jailRole, {
            ViewChannel: false,
          });
        }
      }

      await interaction.reply(`Jailed ${interaction.options.getUser("user")}`);

      if (duration) {
        const time = duration
          .replace("d", " * 24 * 60 * 60 * 1000")
          .replace("h", " * 60 * 60 * 1000")
          .replace("m", " * 60 * 1000")
          .replace("s", " * 1000");

        setTimeout(async () => {
          await user.roles.remove(jailRole);
          for (const roleId of removedRoles) {
            await user.roles.add(roleId);
          }
        }, eval(time));
      }
    } catch (error) {
      console.log("\x1b[31m", `[Error] ${error} at jail.js`);
      await interaction.reply({
        content: "An error occurred while trying to jail the user",
        ephemeral: true,
      });
    }
  },
};
