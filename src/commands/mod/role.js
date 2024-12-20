import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

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

    if (!interaction.member.permissions.has([PermissionFlagsBits.ManageRoles]))
      return await interaction.editReply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });

    const command = interaction.options.getSubcommand();
    const role = interaction.options.getRole("role");
    const color = interaction.options.getString("color");
    const name = interaction.options.getString("name");
    const icon = interaction.options.getAttachment("icon");
    const user = interaction.options.getUser("user");

    try {
      switch (command) {
        case "give":
          await interaction.guild.members.cache
            .find((member) => member.id === user.id)
            .roles.add(role.id);
          break;
        case "remove":
          await interaction.guild.members.cache
            .find((member) => member.id === user.id)
            .roles.remove(role.id);
          break;
        case "create":
          await interaction.guild.roles.create({
            name: name,
            color: color || "#000000",
          });
          break;
        case "delete":
          await interaction.guild.roles.delete(role.id);
          break;
        case "rename":
          await interaction.guild.roles.cache
            .find((r) => r.id === role.id)
            .edit({ name: name });
          break;
        case "color":
          await interaction.guild.roles.cache
            .find((r) => r.id === role.id)
            .edit({ color: color });
          break;
        case "icon":
          await interaction.guild.roles.cache
            .find((r) => r.id === role.id)
            .edit({ icon: icon.url });
          break;
      }

      await interaction.editReply({
        content: `${command} operation successful`,
      });
    } catch (error) {
      console.log(`[error] ${error}`);
      await interaction.editReply({
        content: `Failed to ${command}`,
      });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has([PermissionFlagsBits.ManageRoles]))
      return message.reply("You don't have permission to use this command");

    if (!args.length) return message.reply("Please provide a subcommand");

    const subcommand = args[0].toLowerCase();
    try {
      switch (subcommand) {
        case "give": {
          if (args.length < 3) return message.reply("Please provide a user and role");
          const userId = args[1].replace(/[<@!>]/g, "");
          const roleId = args[2].replace(/[<@&>]/g, "");
          const member = await message.guild.members.fetch(userId);
          const role = await message.guild.roles.fetch(roleId);
          if (!member || !role) return message.reply("Invalid user or role");
          await member.roles.add(role);
          await message.reply(`Given ${role} to ${member}`);
          break;
        }
        case "remove": {
          if (args.length < 3) return message.reply("Please provide a user and role");
          const userId = args[1].replace(/[<@!>]/g, "");
          const roleId = args[2].replace(/[<@&>]/g, "");
          const member = await message.guild.members.fetch(userId);
          const role = await message.guild.roles.fetch(roleId);
          if (!member || !role) return message.reply("Invalid user or role");
          await member.roles.remove(role);
          await message.reply(`Removed ${role} from ${member}`);
          break;
        }
        case "create": {
          if (args.length < 2) return message.reply("Please provide a role name");
          const name = args[1];
          const color = args[2] || "#000000";
          const role = await message.guild.roles.create({ name, color });
          await message.reply(`Created role ${role}`);
          break;
        }
        case "delete": {
          if (args.length < 2) return message.reply("Please provide a role");
          const roleId = args[1].replace(/[<@&>]/g, "");
          const role = await message.guild.roles.fetch(roleId);
          if (!role) return message.reply("Invalid role");
          await role.delete();
          await message.reply("Role deleted");
          break;
        }
        case "rename": {
          if (args.length < 3) return message.reply("Please provide a role and new name");
          const roleId = args[1].replace(/[<@&>]/g, "");
          const newName = args[2];
          const role = await message.guild.roles.fetch(roleId);
          if (!role) return message.reply("Invalid role");
          await role.edit({ name: newName });
          await message.reply(`Renamed role to ${newName}`);
          break;
        }
        case "color": {
          if (args.length < 3) return message.reply("Please provide a role and color");
          const roleId = args[1].replace(/[<@&>]/g, "");
          const color = args[2];
          const role = await message.guild.roles.fetch(roleId);
          if (!role) return message.reply("Invalid role");
          await role.edit({ color });
          await message.reply(`Changed role color to ${color}`);
          break;
        }
        default:
          return message.reply("Invalid subcommand");
      }
    } catch (error) {
      console.error(error);
      await message.reply("An error occurred while executing the command");
    }
  },
};
