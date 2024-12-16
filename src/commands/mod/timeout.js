import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

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

  async execute(interaction, client) {
    await interaction.deferReply();

    if (!interaction.member.permissions.has([PermissionFlagsBits.KickMembers]))
      return await interaction.editReply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });

    try {
      const user = interaction.options.getMember("user");
      const reason = interaction.options.getString("reason");
      let duration = interaction.options.getString("duration");

      duration = duration
        .replace("d", " * 24 * 60 * 60 * 1000")
        .replace("h", " * 60 * 60 * 1000")
        .replace("m", " * 60 * 1000")
        .replace("s", " * 1000");

      for (const guildID of process.env.GUILDS.split(",")) {
        const guild = await interaction.client.guilds.cache.get(guildID);
        const member = await guild.members.fetch(user);

        if (!member) return;
        await member.timeout(eval(duration), reason);
      }

      await interaction.editReply(`Timed out ${user}`);
    } catch (err) {
      console.log("\u001b[31m", `[Error] ${err} at timeout.js`);

      await interaction.editReply({
        content: "An error occured",
        ephemeral: true,
      });
    }
  },
};
