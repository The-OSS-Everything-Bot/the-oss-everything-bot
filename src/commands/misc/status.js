import {
  SlashCommandBuilder,
  ActivityType,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Sets the status of the bot")
    .addStringOption((option) =>
      option
        .setName("status")
        .setDescription("The status of the bot")
        .setRequired(true)
        .addChoices(
          { name: "Online", value: "online" },
          { name: "Idle", value: "idle" },
          { name: "Do Not Disturb", value: "dnd" },
          { name: "Invisible", value: "invisible" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message of the bot")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("activity")
        .setDescription("The activity of the bot")
        .setChoices(
          { name: "Playing", value: "PLAYING" },
          { name: "Streaming", value: "STREAMING" },
          { name: "Listening", value: "LISTENING" },
          { name: "Watching", value: "WATCHING" },
          { name: "Competing", value: "COMPETING" }
        )
        .setRequired(false)
    )
    .setIntegrationTypes([0])
    .setContexts([0, 1]),

  async execute(interaction, client) {
    try {
      if (
        !interaction.member.permissions.has([PermissionFlagsBits.ManageGuild])
      ) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("You don't have permission to use this command");
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const status = interaction.options.getString("status");
      const message = interaction.options.getString("message");
      const type = interaction.options.getString("activity");

      if (message && type) {
        client.user.setPresence({
          status: status,
          activities: [
            { name: message, type: ActivityType[type.toUpperCase()] },
          ],
        });
      } else {
        client.user.setPresence({ status: status });
      }

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(
          `Status set to \`${status}\`${message ? ` with activity: ${type.charAt(0) + type.slice(1).toLowerCase()} ${message}` : ""}`
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at status.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to set status: ${error.message}`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  async prefixExecute(message, args, client) {
    try {
      if (!message.member.permissions.has([PermissionFlagsBits.ManageGuild])) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("You don't have permission to use this command");
        return message.reply({ embeds: [embed] });
      }

      const validStatuses = ["online", "idle", "dnd", "invisible"];
      const validActivities = [
        "PLAYING",
        "STREAMING",
        "LISTENING",
        "WATCHING",
        "COMPETING",
      ];

      const status = args[0]?.toLowerCase();
      if (!status || !validStatuses.includes(status)) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(
            "Please provide a valid status: online, idle, dnd, or invisible"
          );
        return message.reply({ embeds: [embed] });
      }

      if (args.length === 1) {
        client.user.setPresence({ status });
        const embed = new EmbedBuilder()
          .setColor(0x57f287)
          .setDescription(`Status set to \`${status}\``);
        return message.reply({ embeds: [embed] });
      }

      const activityMessage = args.slice(1, -1).join(" ");
      const type = args[args.length - 1]?.toUpperCase();

      if (!type || !validActivities.includes(type)) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(
            "Please provide a valid activity type: playing, streaming, listening, watching, or competing"
          );
        return message.reply({ embeds: [embed] });
      }

      if (!activityMessage) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("Please provide a message for the activity");
        return message.reply({ embeds: [embed] });
      }

      const activityTypeMap = {
        PLAYING: ActivityType.Playing,
        STREAMING: ActivityType.Streaming,
        LISTENING: ActivityType.Listening,
        WATCHING: ActivityType.Watching,
        COMPETING: ActivityType.Competing,
      };

      client.user.setPresence({
        status,
        activities: [{ name: activityMessage, type: activityTypeMap[type] }],
      });

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(
          `Status set to \`${status}\` with activity: ${type.charAt(0) + type.slice(1).toLowerCase()} ${activityMessage}`
        );

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at status.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to set status: ${error.message}`);
      await message.reply({ embeds: [embed] });
    }
  },
};
