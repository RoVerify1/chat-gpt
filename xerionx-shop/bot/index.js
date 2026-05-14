const { Client, GatewayIntentBits, Collection } = require('discord.js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Create client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers
  ]
});

// Command collection
client.commands = new Collection();

// Event emitter for purchase events
const EventEmitter = require('events');
client.deliveryEmitter = new EventEmitter();

// Load handlers
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./eventHandler');

// Initialize handlers
commandHandler(client);
eventHandler(client);

// Error handling
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error);
});

// Login
client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log('✅ XerionX Bot logged in successfully');
  })
  .catch(error => {
  console.error('❌ Failed to login:', error);
  process.exit(1);
});

module.exports = client;
