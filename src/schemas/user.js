export async function getUser(userId) {
  const cachedUser = await global.redis.get(`user:${userId}`);
  if (cachedUser) {
    return JSON.parse(cachedUser);
  }

  const result = await global.libsql.execute({
    sql: "SELECT * FROM users WHERE id = ?",
    args: [userId],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  await global.redis.set(`user:${userId}`, JSON.stringify(user), "EX", 3600);
  return user;
}

export async function createUser(userId, warns = []) {
  const user = {
    id: userId,
    warns,
  };

  await global.libsql.execute({
    sql: "INSERT INTO users (id, warns) VALUES (?, ?)",
    args: [userId, JSON.stringify(warns)],
  });

  await global.redis.set(`user:${userId}`, JSON.stringify(user), "EX", 3600);
  return user;
}

export async function updateUserWarns(userId, warns) {
  await global.libsql.execute({
    sql: "UPDATE users SET warns = ? WHERE id = ?",
    args: [JSON.stringify(warns), userId],
  });

  const user = { id: userId, warns };
  await global.redis.set(`user:${userId}`, JSON.stringify(user), "EX", 3600);
  return user;
}
