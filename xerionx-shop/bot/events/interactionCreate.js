const { Events } = require('discord.js');
const User = require('../../api/models/User');
const SignatureService = require('../../api/services/signature');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`❌ No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        
        const errorMessage = { 
          content: '❌ An error occurred while executing this command.', 
          ephemeral: true 
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }

    // Handle button interactions
    if (interaction.isButton()) {
      await handleButtonInteraction(interaction, client);
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction, client);
    }
  }
};

async function handleButtonInteraction(interaction, client) {
  const [action, ...params] = interaction.customId.split('_');

  switch (action) {
    case 'link':
      await handleLinkButton(interaction, client);
      break;
    case 'confirm':
      // Handle confirmation buttons
      break;
    default:
      console.log(`Unknown button action: ${action}`);
  }
}

async function handleModalSubmit(interaction, client) {
  switch (interaction.customId) {
    case 'link_modal':
      await handleLinkModal(interaction, client);
      break;
    case 'product_modal':
      await handleProductModal(interaction, client);
      break;
    default:
      console.log(`Unknown modal: ${interaction.customId}`);
  }
}

async function handleLinkButton(interaction, client) {
  const userId = interaction.user.id;

  try {
    // Check if already linked
    const user = await User.findOne({ discordId: userId });

    if (user && user.robloxId) {
      await interaction.reply({
        content: '✅ Your account is already linked!',
        ephemeral: true
      });
      return;
    }

    // Generate verification code
    const verificationCode = SignatureService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Update or create user record
    await User.findOneAndUpdate(
      { discordId: userId },
      {
        discordId: userId,
        discordUsername: interaction.user.username,
        verificationCode,
        verificationExpires: expiresAt
      },
      { upsert: true, new: true }
    );

    await interaction.reply({
      content: `🔗 **Account Linking Started**\n\n` +
        `Your verification code is: \`${verificationCode}\`\n\n` +
        `**Instructions:**\n` +
        `1. Join our Roblox game\n` +
        `2. Type \`/verify ${verificationCode}\` in the game chat\n` +
        `3. Your accounts will be linked automatically!\n\n` +
        `*Code expires in 15 minutes.*`,
      ephemeral: true
    });
  } catch (error) {
    console.error('Error handling link button:', error);
    await interaction.reply({
      content: '❌ An error occurred. Please try again.',
      ephemeral: true
    });
  }
}

async function handleLinkModal(interaction, client) {
  const robloxUsername = interaction.fields.getTextInputValue('roblox_username');
  const userId = interaction.user.id;

  await interaction.deferReply({ ephemeral: true });

  try {
    // In a full implementation, this would verify ownership via Roblox API
    // For now, we'll create a pending link request
    await User.findOneAndUpdate(
      { discordId: userId },
      {
        discordId: userId,
        discordUsername: interaction.user.username,
        robloxUsername: robloxUsername,
        // verificationCode would be set after verification
      },
      { upsert: true, new: true }
    );

    await interaction.editReply({
      content: `🔗 **Link Request Submitted**\n\n` +
        `Roblox Username: \`${robloxUsername}\`\n\n` +
        'Please complete verification in-game to finalize the link.'
    });
  } catch (error) {
    console.error('Error handling link modal:', error);
    await interaction.editReply({
      content: '❌ An error occurred. Please try again.'
    });
  }
}

async function handleProductModal(interaction, client) {
  // Handle product creation modal (admin only)
  const productName = interaction.fields.getTextInputValue('product_name');
  const productPrice = interaction.fields.getTextInputValue('product_price');
  const productId = interaction.fields.getTextInputValue('product_id');

  // This would integrate with the product upload system
  await interaction.reply({
    content: `Product submission received: ${productName}`,
    ephemeral: true
  });
}
