import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { getGuildSettings } from "../../utils/dbManager.js";

const FILTERED_WORDS = [
  "shit",
  "fuck",
  "bitch",
  "ass",
  "dick",
  "pussy",
  "cunt",
  "whore",
  "slut",

  "retard",
  "nigger",
  "faggot",
  "dyke",
  "tranny",
  "kike",
  "spic",
  "chink",
  "wetback",

  "sh!t",
  "sh1t",
  "sh*t",
  "sh.t",
  "sh|t",
  "$hit",
  "shlt",
  "shiit",
  "fuk",
  "fck",
  "f.ck",
  "f*ck",
  "f-ck",
  "fvck",
  "phuck",
  "phuk",
  "fk",
  "b!tch",
  "b1tch",
  "b.tch",
  "b*tch",
  "b-tch",
  "b|tch",
  "biatch",
  "bytch",
  "@ss",
  "a$$",
  "azz",
  "@zz",
  "a.ss",
  "a_ss",
  "as$",
  "d!ck",
  "d1ck",
  "d.ck",
  "d*ck",
  "d-ck",
  "d|ck",
  "dicc",
  "dikk",
  "pu$$y",
  "p.ssy",
  "p*ssy",
  "p-ssy",
  "p|ssy",
  "pussi",
  "pusi",
  "wh0re",
  "wh.re",
  "w.h.o.r.e",
  "h0e",
  "h0r",
  "h0ar",

  "n1gg3r",
  "n1gg4",
  "n1663r",
  "n166a",
  "n1gga",
  "f4gg0t",
  "f4gg4t",
  "f4663t",
  "f466ot",
  "r3t4rd",
  "r3tard",
  "ret@rd",
  "ret4rd",

  "s h i t",
  "f u c k",
  "b i t c h",
  "a s s",
  "d i c k",
  "p u s s y",
  "c u n t",
  "n i g g e r",
  "f a g g o t",

  "s.h.i.t",
  "f.u.c.k",
  "b.i.t.c.h",
  "n.i.g.g.e.r",
  "f.a.g.g.o.t",

  "puta",
  "putta",
  "put@",
  "pu.ta",
  "p.uta",
  "mierda",
  "m13rda",
  "m1rd@",
  "m.ierda",
  "kurwa",
  "kurva",
  "kurw@",
  "k.urwa",
  "cyka",
  "suka",
  "cy.ka",
  "c.yka",
  "blyat",
  "bl.yat",
  "bly@t",
  "6lyat",
  "scheiße",
  "schei.e",
  "sch31ss3",
  "scheis",
  "putain",
  "put.ain",
  "put@in",
  "p.utain",
  "merde",
  "m3rd3",
  "m.erde",
  "merd@",
  "chinga",
  "ching@",
  "ch1nga",
  "ch.inga",
  "caralho",
  "c@ralho",
  "car@lho",
  "c.aralho",
  "vittu",
  "v1ttu",
  "v.ittu",
  "vit.tu",
  "fanculo",
  "f@nculo",
  "f.anculo",
  "fan.culo",

  "ez pz",
  "ezpz",
  "3z",
  "3zpz",
  "eazy",
  "get rekt",
  "g3t r3kt",
  "git rekt",
  "get reckt",
  "noob",
  "n00b",
  "nub",
  "newb",
  "nu.b",
  "trash",
  "tr@sh",
  "tr.sh",
  "tr4sh",
  "garb",
  "kys",
  "k y s",
  "k.y.s",
  "k/y/s",
  "k-y-s",
  "L",
  "take the L",
  "hold this L",
  "massive L",

  "dumbfuck",
  "dumb.fuck",
  "dum.fuk",
  "d.umbfuck",
  "fuckface",
  "fuk.face",
  "f.uckface",
  "fvckface",
  "dickhead",
  "d1ckhead",
  "dick.head",
  "d1k.head",
  "asshole",
  "a.sshole",
  "@sshole",
  "a$$hole",

  "skill issue",
  "no skill",
  "uninstall",
  "quit game",
  "dog water",
  "free win",
  "you suck",
  "ur bad",
  "ratio",
  "ratioed",
  "rat1o",
  "rat.io",
  "bozo",
  "b0z0",
  "b.ozo",
  "boz.o",

  "neck yourself",
  "neck urself",
  "neck it",
  "end yourself",
  "end urself",
  "end it",
  "rope yourself",
  "rope urself",
  "do it",
  "kill yourself",
  "kill urself",
  "kys",

  "f​uck",
  "s​hit",
  "b​itch",
  "nigga",
  "n​igger",
  "f\u200Buck",
  "s\u200Bhit",
  "b\u200Bitch",

  "stfu",
  "gtfo",
  "kys",
  "kms",
  "wtf",
  "ffs",
  "stf.u",
  "gt.fo",
  "k.ys",
  "k.ms",
  "w.tf",

  "fack",
  "phuck",
  "phak",
  "fuk",
  "fek",
  "beetch",
  "biotch",
  "bytch",
  "b1tch",
  "azz",
  "axx",
  "a$$",
  "@$$",
  "@ss",
];

export default async (client, message) => {
  if (message.author.bot) return;

  try {
    const settings = await getGuildSettings(message.guild.id);
    console.log("[Debug] Guild settings:", settings);

    if (!settings?.log_channel_id) {
      console.log(
        "[Debug] No log channel configured for guild:",
        message.guild.id
      );
      return;
    }

    const logsChannel = await client.channels.fetch(settings.log_channel_id);
    if (!logsChannel) {
      console.log(
        "[Debug] Could not fetch log channel:",
        settings.log_channel_id
      );
      return;
    }

    const containsFilteredWord =
      message.content &&
      FILTERED_WORDS.some((word) => {
        const regex = new RegExp(`\\b${word}\\b`, "i");
        return regex.test(message.content);
      });

    if (containsFilteredWord) {
      console.log("[Debug] Filtered word detected, sending log");
      const embed = new EmbedBuilder()
        .setTitle("New Report")
        .setColor(0xffff00)
        .addFields(
          {
            name: "User",
            value: `${message.author.tag} (${message.author.id})`,
          },
          { name: "Channel", value: `${message.channel}` },
          { name: "Message", value: message.content },
          {
            name: "Created",
            value: `<t:${Math.floor(message.createdTimestamp / 1000)}:R>`,
          }
        )
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`take_action_${message.author.id}`)
          .setLabel("Take Action")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`ignore_${message.author.id}`)
          .setLabel("Ignore")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`user_info_${message.author.id}`)
          .setLabel("User Info")
          .setStyle(ButtonStyle.Primary)
      );

      await logsChannel.send({ embeds: [embed], components: [row] });
    }
  } catch (error) {
    console.error("[Error] Handle logs failed:", error);
  }
};
