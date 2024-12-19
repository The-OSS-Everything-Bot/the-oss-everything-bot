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

async function initGuildDB(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT,
      guild_id TEXT,
      warns TEXT NOT NULL DEFAULT '[]',
      PRIMARY KEY (id, guild_id)
    )
  `);
}
