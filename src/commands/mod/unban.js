import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";

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
    if (!interaction.member.permissions.has([PermissionFlagsBits.BanMembers]))
      return await interaction.reply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });

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

      await interaction.reply(`Unbanned <@${user.id}>`);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while unbanning the user",
        ephemeral: true,
      });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has([PermissionFlagsBits.BanMembers]))
      return message.reply("You don't have permission to use this command");

    const userId = args[0]?.replace(/[<@!>]/g, "");
    if (!userId) return message.reply("Please provide a user ID to unban");

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

      await message.reply(`Unbanned <@${user.id}>`);
    } catch (error) {
      console.error(error);
      await message.reply("An error occurred while unbanning the user");
    }
  },
};
