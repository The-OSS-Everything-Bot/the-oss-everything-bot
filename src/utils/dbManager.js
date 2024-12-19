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
    const columns = await db.execute("PRAGMA table_info(users)");
    const existingColumns = new Set(columns.rows.map((row) => row.name));

    const requiredColumns = {
      bans: "TEXT NOT NULL DEFAULT '[]'",
      kicks: "TEXT NOT NULL DEFAULT '[]'",
      timeouts: "TEXT NOT NULL DEFAULT '[]'",
      jails: "TEXT NOT NULL DEFAULT '[]'",
    };

    for (const [column, type] of Object.entries(requiredColumns)) {
      if (!existingColumns.has(column)) {
        await db.execute(`ALTER TABLE users ADD COLUMN ${column} ${type}`);
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
  await migrateDB(db);
}
