const { Events } = require('discord.js');
const User = require('../../api/models/User');
const ModMail = require('../../api/models/ModMail');

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message, client) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Handle DMs for modmail system
    if (message.channel.type === 1) { // DM channel
      await handleModMail(message, client);
      return;
    }

    // Handle commands (for slash commands, this won't trigger - handled by interactionCreate)
    if (message.content.startsWith('!')) {
      // Legacy command prefix handling if needed
      const args = message.content.slice(1).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      if (command === 'link') {
        await handleLegacyLink(message, client);
      }
    }
  }
};

async function handleModMail(message, client) {
  const userId = message.author.id;

  try {
    // Find or create modmail thread
    let modmail = await ModMail.findOne({ 
      discordId: userId, 
      isOpen: true 
    });

    if (!modmail) {
      // Create new modmail thread
      // In a full implementation, this would create a thread in a staff channel
      modmail = await ModMail.create({
        userId: userId,
        discordId: userId,
        channelId: message.channel.id,
        messages: []
      });

      // Notify staff (in production, send to a specific channel)
      console.log(`📧 New modmail ticket from ${userId}`);
    }

    // Add message to modmail record
    const messageData = {
      sender: 'user',
      content: message.content,
      attachments: message.attachments.map(att => ({
        url: att.url,
        filename: att.name,
        size: att.size
      })),
      timestamp: new Date()
    };

    modmail.messages.push(messageData);
    await modmail.save();

    // Auto-response for first message
    if (modmail.messages.length === 1) {
      await message.channel.send(
        '📧 **Thank you for contacting XerionX Support!**\n\n' +
        'Your message has been received. A staff member will respond as soon as possible.\n\n' +
        '*Please do not close this DM - reply here to continue the conversation.*'
      );
    }
  } catch (error) {
    console.error('Error handling modmail:', error);
  }
}

async function handleLegacyLink(message, client) {
  const userId = message.author.id;

  try {
    const user = await User.findOne({ discordId: userId });

    if (user && user.robloxId) {
      await message.channel.send(
        '✅ **Your account is already linked!**\n\n' +
        `Discord: <@${userId}>\n` +
        `Roblox ID: \`${user.robloxId}\`\n` +
        `Roblox Username: \`${user.robloxUsername || 'Unknown'}\`\n\n` +
        'You can now access the shop and make purchases!'
      );
    } else if (user && user.verificationCode) {
      await message.channel.send(
        '⏳ **Verification Pending**\n\n' +
        `Your verification code is: \`${user.verificationCode}\`\n\n` +
        'Enter this code in the Roblox game to complete the link.\n' +
        `*Code expires: ${new Date(user.verificationExpires).toLocaleString()}*`
      );
    } else {
      await message.channel.send(
        '🔗 **Account Linking Instructions**\n\n' +
        'To link your Discord and Roblox accounts:\n\n' +
        '1. Join our Roblox game\n' +
        '2. Use the command `/getcode` in the game chat\n' +
        '3. Enter the code you receive\n' +
        '4. Your accounts will be linked automatically!\n\n' +
        '*Or use `/link` command for alternative linking methods.*'
      );
    }
  } catch (error) {
    console.error('Error handling legacy link:', error);
    await message.channel.send('❌ An error occurred. Please try again later.');
  }
}
