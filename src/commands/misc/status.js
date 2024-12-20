import {
  SlashCommandBuilder,
  ActivityType,
  PermissionFlagsBits,
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
        .addChoices([
          {
            name: "Online",
            value: "online",
          },
          {
            name: "Idle",
            value: "idle",
          },
          {
            name: "Do Not Disturb",
            value: "dnd",
          },
          {
            name: "Invisible",
            value: "invisible",
          },
        ])
        .setRequired(true)
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
        .setChoices([
          {
            name: "Playing",
            value: "Playing",
          },
          {
            name: "Streaming",
            value: "Streaming",
          },
          {
            name: "Listening",
            value: "Listening",
          },
          {
            name: "Watching",
            value: "Watching",
          },
          {
            name: "Competing",
            value: "Competing",
          },
        ])
        .setRequired(false)
    )
    .setIntegrationTypes([0])
    .setContexts([0, 1]),

  async execute(interaction, client) {
    if (
      !interaction.member.permissions.has([PermissionFlagsBits.ManageGuild])
    ) {
      return await interaction.reply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });
    }

    const status = interaction.options.getString("status");
    const message = interaction.options.getString("message");
    const type = interaction.options.getString("activity");

    if (message && type) {
      client.user.setPresence({
        status: status,
        activities: [{ name: message, type: ActivityType[type] }],
      });
    } else {
      client.user.setPresence({
        status: status,
      });
    }

    await interaction.reply({
      content: `Status set to ${status}`,
    });
  },

  async prefixExecute(message, args, client) {
    if (!message.member.permissions.has([PermissionFlagsBits.ManageGuild])) {
      return message.reply("You don't have permission to use this command");
    }

    const validStatuses = ["online", "idle", "dnd", "invisible"];
    const validActivities = ["Playing", "Streaming", "Listening", "Watching", "Competing"];

    const status = args[0]?.toLowerCase();
    if (!status || !validStatuses.includes(status)) {
      return message.reply("Please provide a valid status: online, idle, dnd, or invisible");
    }

    if (args.length === 1) {
      client.user.setPresence({ status });
      return message.reply(`Status set to ${status}`);
    }

    const type = args[1];
    if (!validActivities.includes(type)) {
      return message.reply("Please provide a valid activity type: Playing, Streaming, Listening, Watching, or Competing");
    }

    const activityMessage = args.slice(2).join(" ");
    if (!activityMessage) {
      return message.reply("Please provide a message for the activity");
    }

    client.user.setPresence({
      status,
      activities: [{ name: activityMessage, type: ActivityType[type] }],
    });

    await message.reply(`Status set to ${status}`);
  },
};
