import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("role")
    .setDescription("Role commands")

    // modifying members
    .addSubcommand((subcommand) =>
      subcommand
        .setName("give")
        .setDescription("Adds a role to a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to add the role to")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to add")
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

    // creating roles
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Creates a role")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The name of the role")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("color")
            .setDescription("The color of the role")
            .setRequired(true)
        )
    )

    // deleting roles
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

    // modifying roles
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
            .setDescription("The new name of the role")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("color")
        .setDescription("Changes the color of a role")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to change the color of")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("color")
            .setDescription("The new color of the role")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("icon")
        .setDescription("Changes the icon of a role")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to change the icon of")
            .setRequired(true)
        )
        .addAttachmentOption((option) =>
          option
            .setName("icon")
            .setDescription("The new icon of the role")
            .setRequired(true)
        )
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1]),

  /**
   * @param {import("discord.js").CommandInteraction} interaction
   */
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
          await interaction.guild.members.cache.find((member) => member.id === user.id).roles.add(role.id);
          break;
        case "remove":
          await interaction.guild.members.cache.find((member) => member.id === user.id).roles.remove(role.id);
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
          await interaction.guild.roles.cache.find((r) => r.id === role.id).edit({name: name});
          break;
        case "color":
          await interaction.guild.roles.cache.find((r) => r.id === role.id).edit({color: color});
          break;
        case "icon":
          await interaction.guild.roles.cache.find((r) => r.id === role.id).edit({icon: icon.url});
          break;
      }

      await interaction.editReply({
        content: `${command} operation successfully`,
      });

    } catch (error) {
      console.log(`[error] ${error}`);
      await interaction.editReply({
        content: `Failed to ${command}`,
      });
    }
  },
};
