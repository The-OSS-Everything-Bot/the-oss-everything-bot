import { createClient } from "@libsql/client";
import path from "path";
import fs from "fs";

const guildConnections = new Map();

async function ensureGuildDirectory() {
  const guildDir = path.join(process.cwd(), "guilds");
  if (!fs.existsSync(guildDir)) {
    fs.mkdirSync(guildDir, { recursive: true });
  }
}

export async function getGuildDB(guildId) {
  if (guildConnections.has(guildId)) {
    return guildConnections.get(guildId);
  }

  await ensureGuildDirectory();

  const dbPath = path.join(process.cwd(), `guilds/${guildId}.db`);
  const libsql = createClient({
    url: process.env.LIBSQL_URL
      ? `${process.env.LIBSQL_URL}/${guildId}`
      : `file:${dbPath}`,
    authToken: process.env.LIBSQL_AUTH_TOKEN,
  });

  await initGuildDB(libsql);
  guildConnections.set(guildId, libsql);
  return libsql;
}

async function migrateDB(db) {
  try {
    const tables = {
      users: {
        bans: "TEXT NOT NULL DEFAULT '[]'",
        kicks: "TEXT NOT NULL DEFAULT '[]'",
        timeouts: "TEXT NOT NULL DEFAULT '[]'",
        jails: "TEXT NOT NULL DEFAULT '[]'",
      },
      guild_settings: {
        antiraid_enabled: "INTEGER DEFAULT 0",
        antiraid_jail_channel: "TEXT",
        antiraid_msg_threshold: "INTEGER DEFAULT 5",
        antiraid_time_window: "INTEGER DEFAULT 5",
      },
      user_settings: {
        aliases: "TEXT DEFAULT '{}'",
      },
    };

    for (const [table, columns] of Object.entries(tables)) {
      const tableInfo = await db.execute(`PRAGMA table_info(${table})`);
      const existingColumns = new Set(tableInfo.rows.map((row) => row.name));

      for (const [column, type] of Object.entries(columns)) {
        if (!existingColumns.has(column)) {
          await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
        }
      }
    }
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

async function initGuildDB(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT,
      guild_id TEXT,
      warns TEXT NOT NULL DEFAULT '[]',
      bans TEXT NOT NULL DEFAULT '[]',
      kicks TEXT NOT NULL DEFAULT '[]',
      timeouts TEXT NOT NULL DEFAULT '[]',
      jails TEXT NOT NULL DEFAULT '[]',
      PRIMARY KEY (id, guild_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id TEXT PRIMARY KEY,
      log_channel_id TEXT,
      prefix TEXT,
      antiraid_enabled INTEGER DEFAULT 0,
      antiraid_jail_channel TEXT,
      antiraid_msg_threshold INTEGER DEFAULT 5,
      antiraid_time_window INTEGER DEFAULT 5,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS guild_tickets (
      guild_id TEXT PRIMARY KEY,
      channel_id TEXT,
      category_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS role_persistence (
      user_id TEXT,
      guild_id TEXT,
      roles TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      PRIMARY KEY (user_id, guild_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_settings (
      guild_id TEXT,
      user_id TEXT,
      prefix TEXT,
      aliases TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      PRIMARY KEY (guild_id, user_id)
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_guild_settings_guild_id 
    ON guild_settings(guild_id)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_guild_tickets_guild_id 
    ON guild_tickets(guild_id)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_role_persistence_user_guild 
    ON role_persistence(user_id, guild_id)
  `);

  await migrateDB(db);
}

export async function getGuildSettings(guildId) {
  const cacheKey = `guild:${guildId}:settings`;
  const cached = await global.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const guildDB = await getGuildDB(guildId);
  const result = await guildDB.execute({
    sql: "SELECT * FROM guild_settings WHERE guild_id = ?",
    args: [guildId],
  });

  const settings = result.rows[0] || null;
  if (settings) {
    await global.redis.set(cacheKey, JSON.stringify(settings));
  }
  return settings;
}

export async function getGuildTickets(guildId) {
  const cacheKey = `guild:${guildId}:tickets`;
  const cached = await global.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const guildDB = await getGuildDB(guildId);
  const result = await guildDB.execute({
    sql: "SELECT channel_id, category_id FROM guild_tickets WHERE guild_id = ?",
    args: [guildId],
  });

  const tickets = result.rows[0] || null;
  if (tickets) {
    await global.redis.set(cacheKey, JSON.stringify(tickets));
  }
  return tickets;
}

export async function saveUserRoles(userId, guildId, roles) {
  const guildDB = await getGuildDB(guildId);
  await guildDB.execute({
    sql: `INSERT INTO role_persistence (user_id, guild_id, roles)
          VALUES (?, ?, ?)
          ON CONFLICT (user_id, guild_id)
          DO UPDATE SET roles = ?, updated_at = strftime('%s', 'now')`,
    args: [userId, guildId, JSON.stringify(roles), JSON.stringify(roles)],
  });

  const cacheKey = `guild:${guildId}:user:${userId}:roles`;
  await global.redis.set(cacheKey, JSON.stringify(roles));
}

export async function getUserRoles(userId, guildId) {
  const cacheKey = `guild:${guildId}:user:${userId}:roles`;
  const cached = await global.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const guildDB = await getGuildDB(guildId);
  const result = await guildDB.execute({
    sql: "SELECT roles FROM role_persistence WHERE user_id = ? AND guild_id = ?",
    args: [userId, guildId],
  });

  const roles = result.rows[0]?.roles ? JSON.parse(result.rows[0].roles) : [];
  if (roles.length) {
    await global.redis.set(cacheKey, JSON.stringify(roles));
  }
  return roles;
}

export async function getUserPrefix(userId, guildId) {
  const cacheKey = `user:${guildId}:${userId}:prefix`;
  const cached = await global.redis.get(cacheKey);
  if (cached) return cached;

  const guildDB = await getGuildDB(guildId);
  const result = await guildDB.execute({
    sql: "SELECT prefix FROM user_settings WHERE guild_id = ? AND user_id = ?",
    args: [guildId, userId],
  });

  const prefix = result.rows[0]?.prefix;
  if (prefix) {
    await global.redis.set(cacheKey, prefix);
  }
  return prefix;
}
