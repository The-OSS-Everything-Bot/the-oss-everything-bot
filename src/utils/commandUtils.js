export const createCommandInteraction = (message, args) => ({
  reply: async (options) => {
    if (typeof options === "string") {
      return message.reply(options);
    }
    return message.reply(options.content || options);
  },
  deferReply: async () => {
    return message.channel.sendTyping();
  },
  editReply: async (options) => {
    const content =
      typeof options === "string" ? options : options.content || options;
    return message.reply(content);
  },
  fetchReply: async () => {
    return {
      createdTimestamp: Date.now(),
    };
  },
  createdTimestamp: Date.now(),
  options: {
    getString: (name) => {
      if (name === "duration") {
        const durationArg = args.find((arg) => /^\d+[dhms]$/.test(arg));
        return durationArg || null;
      }
      if (name === "reason") {
        const mentionIndex = args.findIndex((arg) => arg.startsWith("<@"));
        return args.slice(mentionIndex + 1).join(" ") || null;
      }
      return null;
    },
    getUser: () => message.mentions.users.first(),
    getChannel: () => message.mentions.channels.first(),
    getRole: () => message.mentions.roles.first(),
    getMember: () => message.mentions.members.first(),
  },
  guild: message.guild,
  member: message.member,
  user: message.author,
  channel: message.channel,
  guildId: message.guild.id,
  isChatInputCommand: () => false,
});
