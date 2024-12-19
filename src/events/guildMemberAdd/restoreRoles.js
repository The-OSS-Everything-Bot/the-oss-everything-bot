import { getUserRoles } from "../../utils/dbManager.js";

export default async (client, member) => {
  try {
    const roles = await getUserRoles(member.id, member.guild.id);
    if (roles.length) {
      for (const roleId of roles) {
        await member.roles.add(roleId).catch(() => null);
      }
    }
  } catch (error) {
    console.error("[Error] Role restoration failed:", error);
  }
};
