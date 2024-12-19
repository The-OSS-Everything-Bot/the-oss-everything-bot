import { getGuildDB } from "../utils/dbManager.js";

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
  await global.redis.set(cacheKey, JSON.stringify(user));
  return user;
}

export async function createUser(userId, guildId, warns = []) {
  const user = {
    id: userId,
    guild_id: guildId,
    warns,
  };

  const guildDB = await getGuildDB(guildId);
  await guildDB.execute({
    sql: "INSERT INTO users (id, guild_id, warns) VALUES (?, ?, ?)",
    args: [userId, guildId, JSON.stringify(warns)],
  });

  const cacheKey = `guild:${guildId}:user:${userId}`;
  await global.redis.set(cacheKey, JSON.stringify(user));
  return user;
}

export async function updateUserWarns(userId, guildId, warns) {
  const guildDB = await getGuildDB(guildId);
  await guildDB.execute({
    sql: "UPDATE users SET warns = ? WHERE id = ? AND guild_id = ?",
    args: [JSON.stringify(warns), userId, guildId],
  });

  const user = { id: userId, guild_id: guildId, warns };
  const cacheKey = `guild:${guildId}:user:${userId}`;
  await global.redis.set(cacheKey, JSON.stringify(user));
  return user;
}
