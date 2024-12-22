import {
  EmbedBuilder,
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from "discord.js";
import { getGuildDB } from "../../utils/dbManager.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Setups a ticket system")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to create the ticket tool in")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("category")
        .setDescription("The category to create tickets in")
        .setRequired(true)
    )
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      if (
        !interaction.member.permissions.has([
          PermissionFlagsBits.ManageChannels,
        ])
      ) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("You don't have permission to use this command");
        return await interaction.editReply({ embeds: [embed] });
      }

      const channel = interaction.options.getChannel("channel");
      const category = interaction.options.getChannel("category");

      if (!channel || !category) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("Invalid channel or category");
        return await interaction.editReply({ embeds: [embed] });
      }

      const guildDB = await getGuildDB(interaction.guildId);

      await guildDB.execute({
        sql: `INSERT INTO guild_tickets (guild_id, channel_id, category_id) 
              VALUES (?, ?, ?)
              ON CONFLICT (guild_id) 
              DO UPDATE SET channel_id = ?, category_id = ?, updated_at = strftime('%s', 'now')`,
        args: [
          interaction.guildId,
          channel.id,
          category.id,
          channel.id,
          category.id,
        ],
      });

      const cacheKey = `guild:${interaction.guildId}:tickets`;
      await global.redis.set(
        cacheKey,
        JSON.stringify({
          channel_id: channel.id,
          category_id: category.id,
        })
      );

      const ticketEmbed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Support Tickets")
        .setDescription("Click the button below to create a new ticket");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("new ticket")
          .setLabel("Create ticket")
          .setStyle(ButtonStyle.Success)
          .setEmoji("🎫")
      );

      await channel.send({
        embeds: [ticketEmbed],
        components: [row],
      });

      const successEmbed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription("Ticket system setup successfully");

      await interaction.editReply({ embeds: [successEmbed], ephemeral: true });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at ticket.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to setup ticket system: ${error.message}`);
      await interaction.editReply({ embeds: [embed] });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has([PermissionFlagsBits.ManageChannels])) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return message.reply({ embeds: [embed] });
    }

    if (args.length < 2) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Please provide a channel and category");
      return message.reply({ embeds: [embed] });
    }

    const channelId = args[0].replace(/[<#>]/g, "");
    const categoryId = args[1].replace(/[<#>]/g, "");

    try {
      const channel = message.guild.channels.cache.get(channelId);
      const category = message.guild.channels.cache.get(categoryId);

      if (!channel || !category) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("Invalid channel or category");
        return message.reply({ embeds: [embed] });
      }

      const guildDB = await getGuildDB(message.guildId);

      await guildDB.execute({
        sql: `INSERT INTO guild_tickets (guild_id, channel_id, category_id) 
              VALUES (?, ?, ?)
              ON CONFLICT (guild_id) 
              DO UPDATE SET channel_id = ?, category_id = ?, updated_at = strftime('%s', 'now')`,
        args: [
          message.guildId,
          channel.id,
          category.id,
          channel.id,
          category.id,
        ],
      });

      const cacheKey = `guild:${message.guildId}:tickets`;
      await global.redis.set(
        cacheKey,
        JSON.stringify({
          channel_id: channel.id,
          category_id: category.id,
        })
      );

      const ticketEmbed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Support Tickets")
        .setDescription("Click the button below to create a new ticket");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("new ticket")
          .setLabel("Create ticket")
          .setStyle(ButtonStyle.Success)
          .setEmoji("🎫")
      );

      await channel.send({
        embeds: [ticketEmbed],
        components: [row],
      });

      const successEmbed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription("Ticket system setup successfully");

      await message.reply({ embeds: [successEmbed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at ticket.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to setup ticket system: ${error.message}`);
      await message.reply({ embeds: [embed] });
    }
  },
};
