import {
  SlashCommandBuilder,
  ActivityType,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import fetch from "node-fetch";

let monitorInterval = null;
let currentRepo = null;

export default {
  data: new SlashCommandBuilder()
    .setName("commit")
    .setDescription("Monitor repository commits")
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("Enable or disable commit monitoring")
        .setRequired(true)
        .addChoices(
          { name: "Enable", value: "enable" },
          { name: "Disable", value: "disable" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("repository")
        .setDescription("GitHub repository (owner/repo)")
        .setRequired(false)
    )
    .setIntegrationTypes([0])
    .setContexts([0]),

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

      const action = interaction.options.getString("action");
      const repository = interaction.options.getString("repository");

      if (action === "disable") {
        if (monitorInterval) {
          clearInterval(monitorInterval);
          monitorInterval = null;
          currentRepo = null;
        }
        client.user.setPresence({
          status: "online",
          activities: [],
        });

        const embed = new EmbedBuilder()
          .setColor(0x57f287)
          .setDescription("Commit monitoring disabled");
        return await interaction.reply({ embeds: [embed] });
      }

      if (!repository) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("Please provide a repository (owner/repo)");
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (currentRepo && currentRepo !== repository) {
        clearInterval(monitorInterval);
        monitorInterval = null;
      }

      const updateCommitStatus = async () => {
        try {
          const repoPath = repository.toLowerCase();
          let response = await fetch(
            `https://api.github.com/repos/${repoPath}/commits/main`
          );
          let data;

          if (response.ok) {
            data = await response.json();
          } else {
            response = await fetch(
              `https://api.github.com/repos/${repoPath}/commits/master`
            );
            if (!response.ok) {
              throw new Error(`Failed to fetch commits: ${response.status}`);
            }
            data = await response.json();
          }

          if (data?.sha) {
            const shortHash = data.sha.substring(0, 7);
            client.user.setPresence({
              status: "dnd",
              activities: [{ name: shortHash, type: ActivityType.Watching }],
            });
          } else {
            throw new Error("No commit hash found");
          }
        } catch (error) {
          console.error("\x1b[31m", `[Error] Failed to fetch commit: ${error}`);
        }
      };

      await updateCommitStatus();

      if (!monitorInterval) {
        monitorInterval = setInterval(updateCommitStatus, 5000);
        currentRepo = repository;
      }

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Now monitoring commits for ${repository}`);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at commit.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to set commit monitoring: ${error.message}`);
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

      const action = args[0]?.toLowerCase();
      const repository = args[1];

      if (!action || !["enable", "disable"].includes(action)) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("Please specify either 'enable' or 'disable'");
        return message.reply({ embeds: [embed] });
      }

      if (action === "disable") {
        if (monitorInterval) {
          clearInterval(monitorInterval);
          monitorInterval = null;
          currentRepo = null;
        }
        client.user.setPresence({ status: "online", activities: [] });

        const embed = new EmbedBuilder()
          .setColor(0x57f287)
          .setDescription("Commit monitoring disabled");
        return message.reply({ embeds: [embed] });
      }

      if (!repository) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("Please provide a repository (owner/repo)");
        return message.reply({ embeds: [embed] });
      }

      if (currentRepo && currentRepo !== repository) {
        clearInterval(monitorInterval);
        monitorInterval = null;
      }

      const updateCommitStatus = async () => {
        try {
          const repoPath = repository.toLowerCase();
          let response = await fetch(
            `https://api.github.com/repos/${repoPath}/commits/main`
          );
          let data;

          if (response.ok) {
            data = await response.json();
          } else {
            response = await fetch(
              `https://api.github.com/repos/${repoPath}/commits/master`
            );
            if (!response.ok) {
              throw new Error(`Failed to fetch commits: ${response.status}`);
            }
            data = await response.json();
          }

          if (data?.sha) {
            const shortHash = data.sha.substring(0, 7);
            client.user.setPresence({
              status: "dnd",
              activities: [{ name: shortHash, type: ActivityType.Watching }],
            });
          } else {
            throw new Error("No commit hash found");
          }
        } catch (error) {
          console.error("\x1b[31m", `[Error] Failed to fetch commit: ${error}`);
        }
      };

      await updateCommitStatus();

      if (!monitorInterval) {
        monitorInterval = setInterval(updateCommitStatus, 5000);
        currentRepo = repository;
      }

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Now monitoring commits for ${repository}`);
      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at commit.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to set commit monitoring: ${error.message}`);
      return message.reply({ embeds: [embed] });
    }
  },
};
