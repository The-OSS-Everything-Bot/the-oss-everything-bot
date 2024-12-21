import { saveUserRoles } from "../../utils/dbManager.js";

export default async (client, oldMember, newMember) => {
  if (!oldMember || !newMember) return;

  const oldRoles = oldMember.roles.cache
    .filter((role) => role.id !== oldMember.guild.id)
    .map((role) => role.id);

  const newRoles = newMember.roles.cache
    .filter((role) => role.id !== newMember.guild.id)
    .map((role) => role.id);

  if (JSON.stringify(oldRoles) !== JSON.stringify(newRoles)) {
    await saveUserRoles(newMember.id, newMember.guild.id, newRoles);
  }
};
