const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../api/models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help with XerionX Shop System'),
  
  async execute(interaction, client) {
    const helpEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('🤖 XerionX Shop System - Help')
      .setDescription('Welcome to the XerionX Shop System! Here are all available commands:')
      .addFields(
        {
          name: '🔗 Account Commands',
          value: '`/link` - Link your Discord to your Roblox account\n`/status` - Check your account link status',
          inline: false
        },
        {
          name: '🛒 Shop Commands',
          value: '`/shop` - Browse available products\n`/purchases` - View your purchase history',
          inline: false
        },
        {
          name: '📦 Admin Commands',
          value: '`/upload` - Upload a new product (Admin only)\n`/stats` - View shop statistics (Admin only)\n`/ban` / `/unban` - Manage user access (Admin only)',
          inline: false
        },
        {
          name: '💬 Support',
          value: 'DM this bot for support inquiries.\nOur team will respond as soon as possible!',
          inline: false
        }
      )
      .addFields({
        name: '📚 Quick Start Guide',
        value: '1. Use `/link` to connect your accounts\n' +
               '2. Browse the shop with `/shop`\n' +
               '3. Purchase items in our Roblox game\n' +
               '4. Receive your purchases via DM automatically!',
        inline: false
      })
      .setFooter({ text: 'XerionX Shop System v1.0.0' })
      .setTimestamp();

    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
  }
};
