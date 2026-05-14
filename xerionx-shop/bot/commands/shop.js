const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../api/models/User');
const Purchase = require('../../api/models/Purchase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Browse available products in the shop')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Filter by category')
        .setRequired(false)
        .addChoices(
          { name: 'Scripts', value: 'scripts' },
          { name: 'Maps', value: 'maps' },
          { name: 'Models', value: 'models' },
          { name: 'Textures', value: 'textures' },
          { name: 'All', value: 'all' }
        )
    ),
  
  async execute(interaction, client) {
    const userId = interaction.user.id;
    const category = interaction.options.getString('category');

    try {
      // Check if user is linked
      const user = await User.findOne({ discordId: userId });

      if (!user || !user.robloxId) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ Account Not Linked')
          .setDescription('You must link your Discord and Roblox accounts to access the shop.')
          .addFields({
            name: 'How to Link',
            value: 'Use `/link` command to get started!',
            inline: false
          });

        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      if (user.isBanned) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('🚫 Account Banned')
          .setDescription(`Your account has been banned.\n**Reason:** ${user.banReason || 'Not specified'}`);

        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      await interaction.deferReply();

      // Fetch products from API or database
      const Product = require('../../api/models/Product');
      
      const query = { isActive: true };
      if (category && category !== 'all') {
        query.category = category;
      }

      const products = await Product.find(query)
        .limit(25)
        .sort({ createdAt: -1 });

      if (products.length === 0) {
        const noProductsEmbed = new EmbedBuilder()
          .setColor(0xFFFF00)
          .setTitle('📦 No Products Found')
          .setDescription('There are currently no products available in this category.');

        return interaction.editReply({ embeds: [noProductsEmbed] });
      }

      // Create shop embed
      const shopEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('🛒 XerionX Shop')
        .setDescription('Browse our premium products below!\n\n**Click on a product to view details.**')
        .setFooter({ text: `Page 1 of ${Math.ceil(products.length / 10)} | Total: ${products.length} products` })
        .setTimestamp();

      // Group products by category
      const categoryGroups = {};
      products.forEach(product => {
        if (!categoryGroups[product.category]) {
          categoryGroups[product.category] = [];
        }
        categoryGroups[product.category].push(product);
      });

      // Add fields for each category
      for (const [cat, prods] of Object.entries(categoryGroups)) {
        const productList = prods.slice(0, 5).map(p => 
          `• **${p.name}** - ${p.price} R$`
        ).join('\n');

        shopEmbed.addFields({
          name: `📁 ${capitalizeFirst(cat)} (${prods.length})`,
          value: productList + (prods.length > 5 ? '\n*...and more*' : ''),
          inline: false
        });
      }

      // Add purchase instructions
      shopEmbed.addFields({
        name: '💡 How to Purchase',
        value: '1. Visit our Roblox game\n' +
               '2. Find the product you want\n' +
               '3. Complete the purchase\n' +
               '4. Receive your item automatically via DM!',
        inline: false
      });

      await interaction.editReply({ embeds: [shopEmbed] });

    } catch (error) {
      console.error('Error in /shop command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Error')
        .setDescription('Failed to load the shop. Please try again later.');

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
};

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
