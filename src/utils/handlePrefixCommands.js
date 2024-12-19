import getLocalCommands from "./getLocalCommands.js";

export default async (client, message) => {
  const prefix = "%";

  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const commands = await getLocalCommands();
  const command = commands.find((cmd) => cmd.data.name === commandName);

  if (!command) return;

  try {
    const interaction = {
      reply: async (options) => {
        if (typeof options === "string") {
          return message.reply(options);
        }
        return message.reply(options);
      },
      deferReply: async () => message.channel.sendTyping(),
      editReply: async (options) => {
        if (typeof options === "string") {
          return message.edit(options);
        }
        return message.edit(options);
      },
      options: {
        getString: (name) => args[0],
        getUser: (name) => message.mentions.users.first(),
        getChannel: (name) => message.mentions.channels.first(),
        getRole: (name) => message.mentions.roles.first(),
      },
      guild: message.guild,
      member: message.member,
      user: message.author,
      channel: message.channel,
      guildId: message.guild.id,
    };

    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    message.reply("There was an error executing this command!");
  }
};
