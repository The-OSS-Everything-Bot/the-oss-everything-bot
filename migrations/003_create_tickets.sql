CREATE TABLE IF NOT EXISTS guild_tickets (
    guild_id TEXT PRIMARY KEY,
    channel_id TEXT,
    category_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_guild_tickets_guild_id ON guild_tickets(guild_id); 