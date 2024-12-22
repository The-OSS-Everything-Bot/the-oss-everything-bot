import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import handleServerLogs from "../../events/serverEvents/handleServerLogs.js";

export default {
  data: new SlashCommandBuilder()
    .setName("role")
    .setDescription("Manage roles")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("give")
        .setDescription("Gives a role to a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to give the role to")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to give")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Removes a role from a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to remove the role from")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to remove")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Creates a new role")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The name of the role")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("color")
            .setDescription("The color of the role (hex)")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Deletes a role")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to delete")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rename")
        .setDescription("Renames a role")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to rename")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The new name")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("color")
        .setDescription("Changes a role's color")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to change")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("color")
            .setDescription("The new color (hex)")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("icon")
        .setDescription("Changes a role's icon")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to change")
            .setRequired(true)
        )
        .addAttachmentOption((option) =>
          option
            .setName("icon")
            .setDescription("The new icon")
            .setRequired(true)
        )
    )
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    await interaction.deferReply();

    if (
      !interaction.member.permissions.has([PermissionFlagsBits.ManageRoles])
    ) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return await interaction.editReply({ embeds: [embed], ephemeral: true });
    }

    const command = interaction.options.getSubcommand();
    const role = interaction.options.getRole("role");
    const color = interaction.options.getString("color");
    const name = interaction.options.getString("name");
    const icon = interaction.options.getAttachment("icon");
    const user = interaction.options.getUser("user");

    try {
      switch (command) {
        case "give": {
          const member = await interaction.guild.members.fetch(user.id);
          await member.roles.add(role.id);
          const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setDescription(`Given ${role} to ${member}`);
          await interaction.editReply({ embeds: [embed] });
          break;
        }
        case "remove": {
          const member = await interaction.guild.members.fetch(user.id);
          await member.roles.remove(role.id);
          const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setDescription(`Removed ${role} from ${member}`);
          await interaction.editReply({ embeds: [embed] });
          break;
        }
        case "create": {
          const newRole = await interaction.guild.roles.create({
            name,
            color: color || "#000000",
          });
          const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setDescription(`Created role ${newRole}`);
          await interaction.editReply({ embeds: [embed] });
          break;
        }
        case "delete": {
          await role.delete();
          const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setDescription(`Deleted role ${role.name}`);
          await interaction.editReply({ embeds: [embed] });
          break;
        }
        case "rename": {
          await role.edit({ name });
          const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setDescription(`Renamed role to ${name}`);
          await interaction.editReply({ embeds: [embed] });
          break;
        }
        case "color": {
          await role.edit({ color });
          const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setDescription(`Changed role color to ${color}`);
          await interaction.editReply({ embeds: [embed] });
          break;
        }
        case "icon": {
          await role.edit({ icon: icon.url });
          const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setDescription(`Changed role icon for ${role.name}`);
          await interaction.editReply({ embeds: [embed] });
          break;
        }
      }

      await handleServerLogs(
        interaction.client,
        interaction.guild,
        "COMMAND_ROLE",
        {
          target: role,
          executor: interaction.user,
          type: command,
          changes: [
            command === "give" || command === "remove" ? user : null,
          ].filter(Boolean),
        }
      );
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at role.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to ${command}: ${error.message}`);
      await interaction.editReply({ embeds: [embed] });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has([PermissionFlagsBits.ManageRoles])) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return message.reply({ embeds: [embed] });
    }

    if (!args.length) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Please provide a subcommand");
      return message.reply({ embeds: [embed] });
    }

    const subcommand = args[0].toLowerCase();
    try {
      switch (subcommand) {
        case "give": {
          if (args.length < 3) {
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setDescription("Please provide a user and role");
            return message.reply({ embeds: [embed] });
          }
          const userId = args[1].replace(/[<@!>]/g, "");
          const roleId = args[2].replace(/[<@&>]/g, "");
          const member = await message.guild.members.fetch(userId);
          const role = await message.guild.roles.fetch(roleId);
          if (!member || !role) {
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setDescription("Invalid user or role");
            return message.reply({ embeds: [embed] });
          }
          await member.roles.add(role);
          const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setDescription(`Given ${role} to ${member}`);
          await message.reply({ embeds: [embed] });
          await handleServerLogs(
            message.client,
            message.guild,
            "COMMAND_ROLE",
            {
              target: role,
              executor: message.author,
              type: "give",
              changes: [member.user],
            }
          );
          break;
        }
        case "remove": {
          if (args.length < 3) {
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setDescription("Please provide a user and role");
            return message.reply({ embeds: [embed] });
          }
          const userId = args[1].replace(/[<@!>]/g, "");
          const roleId = args[2].replace(/[<@&>]/g, "");
          const member = await message.guild.members.fetch(userId);
          const role = await message.guild.roles.fetch(roleId);
          if (!member || !role) {
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setDescription("Invalid user or role");
            return message.reply({ embeds: [embed] });
          }
          await member.roles.remove(role);
          const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setDescription(`Removed ${role} from ${member}`);
          await message.reply({ embeds: [embed] });
          await handleServerLogs(
            message.client,
            message.guild,
            "COMMAND_ROLE",
            {
              target: role,
              executor: message.author,
              type: "remove",
              changes: [member.user],
            }
          );
          break;
        }
        case "create": {
          if (args.length < 2) {
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setDescription("Please provide a role name");
            return message.reply({ embeds: [embed] });
          }
          const name = args[1];
          const color = args[2] || "#000000";
          const role = await message.guild.roles.create({ name, color });
          const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setDescription(`Created role ${role}`);
          await message.reply({ embeds: [embed] });
          await handleServerLogs(
            message.client,
            message.guild,
            "COMMAND_ROLE",
            {
              target: role,
              executor: message.author,
              type: "create",
            }
          );
          break;
        }
        case "delete": {
          if (args.length < 2) {
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setDescription("Please provide a role");
            return message.reply({ embeds: [embed] });
          }
          const roleId = args[1].replace(/[<@&>]/g, "");
          const role = await message.guild.roles.fetch(roleId);
          if (!role) {
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setDescription("Invalid role");
            return message.reply({ embeds: [embed] });
          }
          const roleName = role.name;
          await role.delete();
          const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setDescription(`Deleted role ${roleName}`);
          await message.reply({ embeds: [embed] });
          await handleServerLogs(
            message.client,
            message.guild,
            "COMMAND_ROLE",
            {
              target: { id: roleId, name: roleName },
              executor: message.author,
              type: "delete",
            }
          );
          break;
        }
        case "rename": {
          if (args.length < 3) {
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setDescription("Please provide a role and new name");
            return message.reply({ embeds: [embed] });
          }
          const roleId = args[1].replace(/[<@&>]/g, "");
          const newName = args[2];
          const role = await message.guild.roles.fetch(roleId);
          if (!role) {
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setDescription("Invalid role");
            return message.reply({ embeds: [embed] });
          }
          const oldName = role.name;
          await role.edit({ name: newName });
          const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setDescription(`Renamed role from ${oldName} to ${newName}`);
          await message.reply({ embeds: [embed] });
          await handleServerLogs(
            message.client,
            message.guild,
            "COMMAND_ROLE",
            {
              target: role,
              executor: message.author,
              type: "rename",
              changes: [`${oldName} → ${newName}`],
            }
          );
          break;
        }
        case "color": {
          if (args.length < 3) {
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setDescription("Please provide a role and color");
            return message.reply({ embeds: [embed] });
          }
          const roleId = args[1].replace(/[<@&>]/g, "");
          const color = args[2];
          const role = await message.guild.roles.fetch(roleId);
          if (!role) {
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setDescription("Invalid role");
            return message.reply({ embeds: [embed] });
          }
          const oldColor = role.color.toString(16);
          await role.edit({ color });
          const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setDescription(`Changed role color from #${oldColor} to ${color}`);
          await message.reply({ embeds: [embed] });
          await handleServerLogs(
            message.client,
            message.guild,
            "COMMAND_ROLE",
            {
              target: role,
              executor: message.author,
              type: "color",
              changes: [`#${oldColor} → ${color}`],
            }
          );
          break;
        }
        default: {
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription("Invalid subcommand");
          return message.reply({ embeds: [embed] });
        }
      }
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at role.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to ${subcommand}: ${error.message}`);
      await message.reply({ embeds: [embed] });
    }
  },
};
