export default (client) => {
  console.log(`[info] Logged in as ${client.user.tag} ${client.ws.ping}ms!`);
};
