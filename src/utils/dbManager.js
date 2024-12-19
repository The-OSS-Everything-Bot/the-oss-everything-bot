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
    await db.batch([
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT,
        guild_id TEXT,
        warns TEXT NOT NULL DEFAULT '[]',
        bans TEXT NOT NULL DEFAULT '[]',
        kicks TEXT NOT NULL DEFAULT '[]',
        timeouts TEXT NOT NULL DEFAULT '[]',
        jails TEXT NOT NULL DEFAULT '[]',
        PRIMARY KEY (id, guild_id)
      )`,
      `CREATE TABLE IF NOT EXISTS tickets (
        channel TEXT NOT NULL PRIMARY KEY,
        category TEXT NOT NULL
      )`,
    ]);

    const [{ rows: usersColumns }, { rows: ticketsColumns }] = await db.batch([
      "PRAGMA table_info(users)",
      "PRAGMA table_info(tickets)",
    ]);

    const existingUsersColumns = new Set(usersColumns.map((row) => row.name));
    const existingTicketsColumns = new Set(
      ticketsColumns.map((row) => row.name)
    );

    const requiredUsersColumns = {
      bans: "TEXT NOT NULL DEFAULT '[]'",
      kicks: "TEXT NOT NULL DEFAULT '[]'",
      timeouts: "TEXT NOT NULL DEFAULT '[]'",
      jails: "TEXT NOT NULL DEFAULT '[]'",
    };

    for (const [column, type] of Object.entries(requiredUsersColumns)) {
      if (!existingUsersColumns.has(column)) {
        await db.execute(`ALTER TABLE users ADD COLUMN ${column} ${type}`);
      }
    }

    const requiredTicketsColumns = {
      category: "TEXT NOT NULL",
      channel: "TEXT NOT NULL",
    };

    for (const [column, type] of Object.entries(requiredTicketsColumns)) {
      if (!existingTicketsColumns.has(column)) {
        await db.execute(`ALTER TABLE tickets ADD COLUMN ${column} ${type}`);
      }
    }
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

async function initGuildDB(db) {
  await migrateDB(db);
}
