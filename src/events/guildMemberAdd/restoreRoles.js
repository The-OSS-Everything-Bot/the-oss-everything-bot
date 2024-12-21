import { getUserRoles } from "../../utils/dbManager.js";

export default async (client, member) => {
  try {
    const savedRoles = await getUserRoles(member.id, member.guild.id);
    if (!savedRoles.length) return;

    const validRoles = [];
    for (const roleId of savedRoles) {
      const role = member.guild.roles.cache.get(roleId);
      if (
        role &&
        !role.managed &&
        role.position < member.guild.members.me.roles.highest.position
      ) {
        validRoles.push(roleId);
      }
    }

    if (validRoles.length) {
      for (const roleId of validRoles) {
        await member.roles.add(roleId).catch(() => null);
      }
    }
  } catch (error) {
    console.error("[Error] Role restoration failed:", error);
  }
};
