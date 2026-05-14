const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`🤖 ${client.user.tag} is online!`);
    console.log(`📊 Serving ${client.guilds.cache.size} server(s)`);

    // Set bot status
    client.user.setPresence({
      activities: [{ 
        name: 'XerionX Shop | /help', 
        type: 2 // Playing
      }],
      status: 'online'
    });
  }
};
