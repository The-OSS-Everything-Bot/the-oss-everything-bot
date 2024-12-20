import { getGuildDB } from "../utils/dbManager.js";

const ACTIONS = ["warns", "bans", "kicks", "timeouts", "jails"];

export async function getUser(userId, guildId) {
  const cacheKey = `guild:${guildId}:user:${userId}`;
  const cachedUser = await global.redis.get(cacheKey);
  if (cachedUser) {
    return JSON.parse(cachedUser);
  }

  const guildDB = await getGuildDB(guildId);
  const result = await guildDB.execute({
    sql: "SELECT * FROM users WHERE id = ? AND guild_id = ?",
    args: [userId, guildId],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  ACTIONS.forEach((action) => {
    try {
      user[action] = JSON.parse(user[action]);
    } catch {
      user[action] = [];
    }
  });

  await global.redis.set(cacheKey, JSON.stringify(user));
  return user;
}

export async function createUser(userId, guildId, data = {}) {
  const user = {
    id: userId,
    guild_id: guildId,
    ...Object.fromEntries(
      ACTIONS.map((action) => [action, data[action] || []])
    ),
  };

  const guildDB = await getGuildDB(guildId);
  await guildDB.execute({
    sql: "INSERT INTO users (id, guild_id, warns, bans, kicks, timeouts, jails) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [
      userId,
      guildId,
      ...ACTIONS.map((action) => JSON.stringify(user[action])),
    ],
  });

  const cacheKey = `guild:${guildId}:user:${userId}`;
  await global.redis.set(cacheKey, JSON.stringify(user));
  return user;
}

export async function updateUserLogs(userId, guildId, action, logs) {
  if (!ACTIONS.includes(action)) {
    throw new Error(`Invalid action: ${action}`);
  }

  const guildDB = await getGuildDB(guildId);
  await guildDB.execute({
    sql: `UPDATE users SET ${action} = ? WHERE id = ? AND guild_id = ?`,
    args: [JSON.stringify(logs), userId, guildId],
  });

  const user = await getUser(userId, guildId);
  user[action] = logs;

  const cacheKey = `guild:${guildId}:user:${userId}`;
  await global.redis.set(cacheKey, JSON.stringify(user));
  return user;
}
