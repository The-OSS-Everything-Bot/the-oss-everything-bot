import { getGuildDB } from "../utils/dbManager.js";

/**
 *
 * @param {string} guildId
 * @param {string} channel
 * @returns {{ guild_id: string, tickets: {channelId: string category: string}[] } | null}
 */
export async function getGuildTicket(guildId, channel) {
  const guildDB = await getGuildDB(guildId);
  const result = await guildDB.batch([
    {
      sql: "SELECT * FROM tickets WHERE channel = ?",
      args: [channel],
    },
  ]);

  if (result[0].rows.length === 0) {
    return null;
  }

  return result[0].rows[0];
}

/**
 *
 * @param {string} guildId
 * @param {{ category: string, channel: string }} data
 */
export async function setGuildTickets(guildId, { category, channel }) {
  const guildDB = await getGuildDB(guildId);

  await guildDB.execute({
    sql: "INSERT INTO tickets (category, channel) VALUES (?, ?) ON CONFLICT (channel) DO UPDATE SET (category) = ?",
    args: [category, channel, category],
  });
}
