import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";
import ms from "ms";

export default {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeouts a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to timeout")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription("The duration of the timeout (1m, 1h, 1d)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the timeout")
        .setRequired(false)
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1]),

  async execute(interaction) {
    if (!interaction.member.permissions.has([PermissionFlagsBits.ModerateMembers]))
      return await interaction.reply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });

    const user = interaction.options.getUser("user");
    const duration = interaction.options.getString("duration");
    const reason = interaction.options.getString("reason") || "Not provided";

    if (!duration.match(/^\d+[dhms]$/)) {
      return await interaction.reply({
        content: "Invalid duration format. Use s/m/h/d (e.g. 30s, 5m, 2h, 1d)",
        ephemeral: true,
      });
    }

    const durationMs = ms(duration);
    if (!durationMs) {
      return await interaction.reply({
        content: "Invalid duration format",
        ephemeral: true,
      });
    }

    try {
      const member = await interaction.guild.members.fetch(user.id);
      if (!member) {
        return await interaction.reply({
          content: "User not found in this server",
          ephemeral: true,
        });
      }

      await member.timeout(durationMs, reason);

      let userData = await getUser(user.id, interaction.guildId);
      let timeouts = userData?.timeouts || [];

      timeouts.push({
        reason,
        duration,
        by: interaction.user.id,
        createdAt: Date.now(),
      });

      if (!userData) {
        await createUser(user.id, interaction.guildId, { timeouts });
      } else {
        await updateUserLogs(user.id, interaction.guildId, "timeouts", timeouts);
      }

      await interaction.reply(`Timed out <@${user.id}> for ${duration}`);
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at timeout.js`);
      await interaction.reply({
        content: "An error occurred while timing out the user",
        ephemeral: true,
      });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has([PermissionFlagsBits.ModerateMembers]))
      return message.reply("You don't have permission to use this command");

    if (args.length < 2)
      return message.reply("Please provide a user and duration");

    const userId = args[0].replace(/[<@!>]/g, "");
    const duration = args[1];
    const reason = args.slice(2).join(" ") || "Not provided";

    if (!duration.match(/^\d+[dhms]$/)) {
      return message.reply("Invalid duration format. Use s/m/h/d (e.g. 30s, 5m, 2h, 1d)");
    }

    const durationMs = ms(duration);
    if (!durationMs) return message.reply("Invalid duration format");

    try {
      const member = await message.guild.members.fetch(userId).catch(() => null);
      if (!member) return message.reply("User not found in this server");

      await member.timeout(durationMs, reason);

      let userData = await getUser(userId, message.guildId);
      let timeouts = userData?.timeouts || [];

      timeouts.push({
        reason,
        duration,
        by: message.author.id,
        createdAt: Date.now(),
      });

      if (!userData) {
        await createUser(userId, message.guildId, { timeouts });
      } else {
        await updateUserLogs(userId, message.guildId, "timeouts", timeouts);
      }

      await message.reply(`Timed out <@${userId}> for ${duration}`);
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at timeout.js`);
      await message.reply("An error occurred while timing out the user");
    }
  },
};
