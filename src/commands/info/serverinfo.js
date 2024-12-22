import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Displays information about the server")
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1]),

  async execute(interaction) {
    const guild = interaction.guild;
    const owner = await guild.fetchOwner();
    const botCount = guild.members.cache.filter(
      (member) => member.user.bot
    ).size;
    const humanCount = guild.members.cache.filter(
      (member) => !member.user.bot
    ).size;
    const totalMembers = guild.memberCount;
    const textChannels = guild.channels.cache.filter((c) => c.type === 0).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === 2).size;
    const categoryCount = guild.channels.cache.filter((c) => c.type === 4).size;
    const roleCount = guild.roles.cache.size;
    const emojiCount = guild.emojis.cache.size;
    const boostCount = guild.premiumSubscriptionCount;
    const boostLevel = guild.premiumTier;
    const verificationLevel = {
      0: "None",
      1: "Low",
      2: "Medium",
      3: "High",
      4: "Highest",
    }[guild.verificationLevel];

    const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);
    const createdDate = new Date(guild.createdTimestamp);
    const monthsAgo = Math.floor(
      (Date.now() - createdDate) / (1000 * 60 * 60 * 24 * 30)
    );

    const designValue = [
      `Splash: ${guild.splash ? `[Click here](${guild.splashURL({ size: 4096 })})` : "None"}`,
      `Banner: ${guild.banner ? `[Click here](${guild.bannerURL({ size: 4096 })})` : "None"}`,
      `Icon: ${guild.icon ? `[Click here](${guild.iconURL({ size: 4096, dynamic: true })})` : "None"}`,
    ].join("\n");

    const embed = new EmbedBuilder()
      .setAuthor({
        name: guild.name,
        iconURL: guild.iconURL({ dynamic: true }),
      })
      .setTitle("Server Information")
      .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
      .setColor(0x2b2d31)
      .addFields(
        {
          name: "Server created on",
          value: `<t:${createdTimestamp}:D> (${monthsAgo} months ago)`,
          inline: true,
        },
        {
          name: "Owner",
          value: `<@${owner.user.id}>`,
          inline: true,
        },
        {
          name: "Members",
          value: `Total: ${totalMembers}\nHumans: ${humanCount}\nBots: ${botCount}`,
          inline: true,
        },
        {
          name: "Design",
          value: designValue,
          inline: true,
        },
        {
          name: `Channels (${textChannels + voiceChannels + categoryCount})`,
          value: `Text: ${textChannels}\nVoice: ${voiceChannels}\nCategory: ${categoryCount}`,
          inline: true,
        },
        {
          name: "Counts",
          value: `Roles: ${roleCount}\nEmojis: ${emojiCount}/500\nBoosters: ${boostCount}`,
          inline: true,
        },
        {
          name: "Information",
          value: `Verification: ${verificationLevel}\nBoosts: ${boostCount} (level ${boostLevel})`,
          inline: true,
        }
      )
      .setFooter({
        text: `Guild ID: ${guild.id} • Today at ${new Date().toLocaleTimeString()}`,
      });

    await interaction.reply({ embeds: [embed] });
  },

  async prefixExecute(message) {
    const guild = message.guild;
    const owner = await guild.fetchOwner();
    const botCount = guild.members.cache.filter(
      (member) => member.user.bot
    ).size;
    const humanCount = guild.members.cache.filter(
      (member) => !member.user.bot
    ).size;
    const totalMembers = guild.memberCount;
    const textChannels = guild.channels.cache.filter((c) => c.type === 0).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === 2).size;
    const categoryCount = guild.channels.cache.filter((c) => c.type === 4).size;
    const roleCount = guild.roles.cache.size;
    const emojiCount = guild.emojis.cache.size;
    const boostCount = guild.premiumSubscriptionCount;
    const boostLevel = guild.premiumTier;
    const verificationLevel = {
      0: "None",
      1: "Low",
      2: "Medium",
      3: "High",
      4: "Highest",
    }[guild.verificationLevel];

    const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);
    const createdDate = new Date(guild.createdTimestamp);
    const monthsAgo = Math.floor(
      (Date.now() - createdDate) / (1000 * 60 * 60 * 24 * 30)
    );

    const designValue = [
      `Splash: ${guild.splash ? `[Click here](${guild.splashURL({ size: 4096 })})` : "None"}`,
      `Banner: ${guild.banner ? `[Click here](${guild.bannerURL({ size: 4096 })})` : "None"}`,
      `Icon: ${guild.icon ? `[Click here](${guild.iconURL({ size: 4096, dynamic: true })})` : "None"}`,
    ].join("\n");

    const embed = new EmbedBuilder()
      .setAuthor({
        name: guild.name,
        iconURL: guild.iconURL({ dynamic: true }),
      })
      .setTitle("Server Information")
      .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
      .setColor(0x2b2d31)
      .addFields(
        {
          name: "Server created on",
          value: `<t:${createdTimestamp}:D> (${monthsAgo} months ago)`,
          inline: true,
        },
        {
          name: "Owner",
          value: `<@${owner.user.id}>`,
          inline: true,
        },
        {
          name: "Members",
          value: `Total: ${totalMembers}\nHumans: ${humanCount}\nBots: ${botCount}`,
          inline: true,
        },
        {
          name: "Design",
          value: designValue,
          inline: true,
        },
        {
          name: `Channels (${textChannels + voiceChannels + categoryCount})`,
          value: `Text: ${textChannels}\nVoice: ${voiceChannels}\nCategory: ${categoryCount}`,
          inline: true,
        },
        {
          name: "Counts",
          value: `Roles: ${roleCount}\nEmojis: ${emojiCount}/500\nBoosters: ${boostCount}`,
          inline: true,
        },
        {
          name: "Information",
          value: `Verification: ${verificationLevel}\nBoosts: ${boostCount} (level ${boostLevel})`,
          inline: true,
        }
      )
      .setFooter({
        text: `Guild ID: ${guild.id} • Today at ${new Date().toLocaleTimeString()}`,
      });

    await message.reply({ embeds: [embed] });
  },
};
