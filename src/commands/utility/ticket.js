import {
  EmbedBuilder,
  SlashCommandBuilder,
  ButtonBuilder,
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
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      if (
        !interaction.member.permissions.has([
          PermissionFlagsBits.ManageChannels,
        ])
      ) {
        return await interaction.editReply({
          content: "You don't have permission to use this command",
        });
      }

      const channel = interaction.options.getChannel("channel");
      const category = interaction.options.getChannel("category");
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

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Ticket")
            .setDescription("Would you like to create new ticket?"),
        ],
        components: [
          {
            type: 1,
            components: [
              new ButtonBuilder()
                .setCustomId(`new ticket`)
                .setLabel("Create ticket")
                .setStyle(3)
                .setEmoji("🎫"),
            ],
          },
        ],
      });

      await interaction.editReply({
        content: "Ticket channel setup successfully",
        ephemeral: true,
      });
    } catch (err) {
      console.error(`[Error] ${err}`);
      await interaction.editReply({
        content: "Something went wrong",
        ephemeral: true,
      });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has([PermissionFlagsBits.ManageChannels]))
      return message.reply("You don't have permission to use this command");

    if (args.length < 2)
      return message.reply("Please provide a channel and category");

    const channelId = args[0].replace(/[<#>]/g, "");
    const categoryId = args[1].replace(/[<#>]/g, "");

    try {
      const channel = message.guild.channels.cache.get(channelId);
      const category = message.guild.channels.cache.get(categoryId);

      if (!channel || !category)
        return message.reply("Invalid channel or category");

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

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Ticket")
            .setDescription("Would you like to create new ticket?"),
        ],
        components: [
          {
            type: 1,
            components: [
              new ButtonBuilder()
                .setCustomId(`new ticket`)
                .setLabel("Create ticket")
                .setStyle(3)
                .setEmoji("🎫"),
            ],
          },
        ],
      });

      await message.reply("Ticket channel setup successfully");
    } catch (error) {
      console.error(`[Error] ${error}`);
      await message.reply("Something went wrong");
    }
  },
};
