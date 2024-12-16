import { EmbedBuilder } from "discord.js";

export default async (client, member) => {
  // if(member.user.bot) return;

  console.log(member.user.tag);
  const channel =
    member.guild.channels.cache.get("1061712782191509516") ||
    (await member.guild.channels.fetch("1061712782191509516"));

  channel.send({
    embeds: [
      new EmbedBuilder({
        title: "New Member",
        description: `Welcome ${member.user.tag} to ${member.guild.name}!`,
        footer: {
            icon_url: member.guild.iconURL(),
            text: member.guild.name
        }
    }),
    ],
  });
};
