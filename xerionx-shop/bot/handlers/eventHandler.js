const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  const eventsPath = path.join(__dirname, '../events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    
    console.log(`✅ Loaded event: ${event.name}`);
  }

  // Load delivery event listeners
  loadDeliveryListeners(client);
};

function loadDeliveryListeners(client) {
  // Listen for purchase verified events from API
  client.deliveryEmitter.on('purchase:verified', async (data) => {
    const { purchase, user, product } = data;
    
    try {
      const discordUser = await client.users.fetch(user.discordId);
      
      if (!discordUser) {
        console.error(`Could not find Discord user: ${user.discordId}`);
        return;
      }

      // Send delivery DM
      await sendDeliveryMessage(discordUser, purchase, product);
      
      console.log(`✅ Delivered product "${product.name}" to ${user.discordId}`);
    } catch (error) {
      console.error(`Failed to deliver to ${user.discordId}:`, error);
      
      // Update purchase status
      const Purchase = require('../api/models/Purchase');
      await Purchase.findByIdAndUpdate(purchase._id, {
        deliveryStatus: 'failed',
        errorMessage: error.message
      });
    }
  });

  // Listen for resend events
  client.deliveryEmitter.on('purchase:resend', async (data) => {
    const { purchase } = data;
    
    try {
      const Product = require('../api/models/Product');
      const User = require('../api/models/User');
      
      const product = await Product.findById(purchase.productId);
      const user = await User.findOne({ discordId: purchase.discordId });
      
      if (!product || !user) {
        console.error('Product or user not found for resend');
        return;
      }

      const discordUser = await client.users.fetch(user.discordId);
      await sendDeliveryMessage(discordUser, purchase, product);
      
      // Update purchase status
      const Purchase = require('../api/models/Purchase');
      await Purchase.findByIdAndUpdate(purchase._id, {
        deliveryStatus: 'delivered',
        deliveredAt: new Date()
      });
      
      console.log(`✅ Re-delivered product to ${user.discordId}`);
    } catch (error) {
      console.error(`Failed to re-deliver to ${purchase.discordId}:`, error);
    }
  });
}

async function sendDeliveryMessage(user, purchase, product) {
  let messageContent = `🎉 **Thank you for your purchase!**\n\n`;
  messageContent += `**Product:** ${product.name}\n`;
  messageContent += `**Transaction ID:** \`${purchase.purchaseId}\`\n\n`;

  const files = [];

  // Handle different delivery methods
  if (product.deliveryMethod === 'attachment') {
    messageContent += '\n📎 Your purchased file is attached below.';
    
    if (product.filePath && fs.existsSync(product.filePath)) {
      files.push(product.filePath);
    }
  } else if (product.deliveryMethod === 'link') {
    messageContent += `\n🔗 **Download Link:** ${product.filePath}\n`;
    messageContent += '\n*This link is for your personal use only.*';
  } else if (product.deliveryMethod === 'key') {
    const SignatureService = require('../api/services/signature');
    const licenseKey = SignatureService.generateLicenseKey(product.licenseKeyPrefix);
    
    messageContent += `\n🔑 **Your License Key:**\n`;
    messageContent += `\`\`\`${licenseKey}\`\`\`\n`;
    messageContent += '\n*Please save this key in a secure location.*';
    
    // Store the key in the purchase record
    const Purchase = require('../api/models/Purchase');
    await Purchase.findByIdAndUpdate(purchase._id, {
      deliveryData: { ...purchase.deliveryData, licenseKey }
    });
  }

  messageContent += `\n\n---\n*If you have any issues, please contact support by DMing this bot.*`;

  await user.send({
    content: messageContent,
    files: files.length > 0 ? files : []
  });

  // Update purchase record
  const Purchase = require('../api/models/Purchase');
  await Purchase.findByIdAndUpdate(purchase._id, {
    deliveryStatus: 'delivered',
    deliveredAt: new Date(),
    deliveryData: {
      ...purchase.deliveryData,
      messageId: null // Could store message ID if needed
    }
  });
}
