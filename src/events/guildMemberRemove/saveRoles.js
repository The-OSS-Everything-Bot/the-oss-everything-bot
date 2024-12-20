import { saveUserRoles } from "../../utils/dbManager.js";

export default async (client, member) => {
  const roles = member.roles.cache
    .filter((role) => role.id !== member.guild.id)
    .map((role) => role.id);

  if (roles.length) {
    await saveUserRoles(member.id, member.guild.id, roles);
  }
};
