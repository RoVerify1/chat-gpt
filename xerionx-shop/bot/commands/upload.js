const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const Product = require('../../api/models/Product');
const User = require('../../api/models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('upload')
    .setDescription('Upload a new product to the shop (Admin only)')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Product name')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Product description')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('price')
        .setDescription('Price in Robux')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option.setName('product-id')
        .setDescription('Roblox Product ID (Dev Product or Gamepass ID)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Product type')
        .setRequired(true)
        .addChoices(
          { name: 'Dev Product', value: 'devproduct' },
          { name: 'Gamepass', value: 'gamepass' }
        )
    )
    .addAttachmentOption(option =>
      option.setName('file')
        .setDescription('Product file (zip, script, etc.)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Product category')
        .setRequired(false)
        .addChoices(
          { name: 'Scripts', value: 'scripts' },
          { name: 'Maps', value: 'maps' },
          { name: 'Models', value: 'models' },
          { name: 'Textures', value: 'textures' },
          { name: 'Other', value: 'other' }
        )
    )
    .addStringOption(option =>
      option.setName('delivery')
        .setDescription('Delivery method')
        .setRequired(false)
        .addChoices(
          { name: 'Attachment', value: 'attachment' },
          { name: 'Link', value: 'link' },
          { name: 'License Key', value: 'key' }
        )
    ),
  
  async execute(interaction, client) {
    // Check if user is admin
    const adminIds = process.env.ADMIN_IDS?.split(',') || [];
    if (!adminIds.includes(interaction.user.id)) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Access Denied')
        .setDescription('You do not have permission to use this command.');
      
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const name = interaction.options.getString('name');
      const description = interaction.options.getString('description');
      const price = interaction.options.getInteger('price');
      const robloxProductId = interaction.options.getString('product-id');
      const productIdType = interaction.options.getString('type');
      const attachment = interaction.options.getAttachment('file');
      const category = interaction.options.getString('category') || 'general';
      const deliveryMethod = interaction.options.getString('delivery') || 'attachment';

      // Validate file type
      const allowedExtensions = ['zip', 'lua', 'txt', 'md', 'pdf', 'png', 'jpg', 'jpeg'];
      const fileExtension = attachment.name.split('.').pop().toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(`File type .${fileExtension} is not allowed. Allowed types: ${allowedExtensions.join(', ')}`);
      }

      // Check if product ID already exists
      const existingProduct = await Product.findOne({ robloxProductId });
      if (existingProduct) {
        throw new Error('A product with this Roblox Product ID already exists.');
      }

      // Download and save the file
      const storagePath = process.env.FILE_STORAGE_PATH || './uploads';
      await fs.mkdir(storagePath, { recursive: true });

      const fileName = `${Date.now()}-${attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(storagePath, fileName);

      const response = await fetch(attachment.url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filePath, buffer);

      // Determine file type
      let fileType = 'other';
      if (['zip'].includes(fileExtension)) fileType = 'zip';
      else if (['lua'].includes(fileExtension)) fileType = 'script';
      else if (['png', 'jpg', 'jpeg'].includes(fileExtension)) fileType = 'image';
      else if (['txt', 'md', 'pdf'].includes(fileExtension)) fileType = 'document';

      // Create product in database
      const product = await Product.create({
        name,
        description,
        price,
        robloxProductId,
        productIdType,
        fileType,
        filePath,
        fileName: attachment.name,
        fileSize: attachment.size,
        deliveryMethod,
        category,
        uploadedBy: interaction.user.id
      });

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Product Uploaded Successfully')
        .addFields(
          { name: 'Name', value: name, inline: true },
          { name: 'Price', value: `${price} R$`, inline: true },
          { name: 'Category', value: category, inline: true },
          { name: 'Product ID', value: `\`${robloxProductId}\``, inline: false },
          { name: 'File', value: `${attachment.name} (${formatFileSize(attachment.size)})`, inline: false }
        )
        .setFooter({ text: `Uploaded by ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Log the upload
      const Log = require('../../api/models/Log');
      await Log.create({
        action: 'product_uploaded_admin',
        userId: interaction.user.id,
        productId: product._id.toString(),
        details: { name, robloxProductId, fileName: attachment.name }
      });

    } catch (error) {
      console.error('Error in /upload command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Upload Failed')
        .setDescription(`Error: ${error.message}`);

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
