import { EmbedBuilder } from "discord.js";
import { getGuildSettings } from "../../utils/dbManager.js";

export default async (client, member) => {
  try {
    const settings = await getGuildSettings(member.guild.id);
    if (!settings?.welcome_channel_id) return;

    const channel = await client.channels.fetch(settings.welcome_channel_id);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle("New Member")
      .setDescription(`Welcome ${member.user.tag} to ${member.guild.name}!`)
      .setColor(0x57f287)
      .setTimestamp()
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: member.guild.name,
        iconURL: member.guild.iconURL(),
      });

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("[Error] Welcome message failed:", error);
  }
};
