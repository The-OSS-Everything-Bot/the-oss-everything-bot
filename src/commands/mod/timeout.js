import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";

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
        .setDescription(
          "The duration of the timeout, for example: 1d, 2h, 3m, 4s"
        )
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
    await interaction.deferReply();

    if (!interaction.member.permissions.has([PermissionFlagsBits.KickMembers]))
      return await interaction.editReply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });

    try {
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "Not provided";
      let duration = interaction.options.getString("duration");

      duration = duration
        .replace("d", " * 24 * 60 * 60 * 1000")
        .replace("h", " * 60 * 60 * 1000")
        .replace("m", " * 60 * 1000")
        .replace("s", " * 1000");

      const timeoutDuration = eval(duration);

      const guild = interaction.guild;
      const member = await guild.members.fetch(user.id).catch(() => null);

      if (!member) {
        return await interaction.editReply({
          content: "User not found in this server",
          ephemeral: true,
        });
      }

      await member.timeout(timeoutDuration, reason);

      let userData = await getUser(user.id, guild.id);
      let timeouts = userData?.timeouts || [];

      timeouts.push({
        reason,
        duration: timeoutDuration,
        by: interaction.user.id,
        createdAt: Date.now(),
      });

      if (!userData) {
        await createUser(user.id, guild.id, { timeouts });
      } else {
        await updateUserLogs(user.id, guild.id, "timeouts", timeouts);
      }

      await interaction.editReply(`Timed out <@${user.id}>`);
    } catch (err) {
      console.error("\u001b[31m", `[Error] ${err} at timeout.js`);
      await interaction.editReply({
        content: "An error occurred while timing out the user",
        ephemeral: true,
      });
    }
  },
};
