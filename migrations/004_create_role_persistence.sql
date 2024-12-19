CREATE TABLE IF NOT EXISTS role_persistence (
    user_id TEXT,
    guild_id TEXT,
    roles TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (user_id, guild_id)
);

CREATE INDEX IF NOT EXISTS idx_role_persistence_user_guild ON role_persistence(user_id, guild_id); 