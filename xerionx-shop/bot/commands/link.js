const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../api/models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your Discord account to your Roblox account'),
  
  async execute(interaction, client) {
    const userId = interaction.user.id;

    try {
      // Check if already linked
      const user = await User.findOne({ discordId: userId });

      if (user && user.robloxId) {
        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('✅ Already Linked')
          .setDescription('Your Discord account is already linked to a Roblox account.')
          .addFields(
            { name: 'Discord ID', value: `\`${user.discordId}\``, inline: true },
            { name: 'Roblox ID', value: `\`${user.robloxId}\``, inline: true },
            { name: 'Roblox Username', value: `\`${user.robloxUsername || 'Unknown'}\``, inline: true }
          )
          .setFooter({ text: 'XerionX Shop System' })
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Generate verification code
      const SignatureService = require('../../api/services/signature');
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

      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('🔗 Account Linking')
        .setDescription('**Follow these steps to link your accounts:**')
        .addFields(
          { 
            name: 'Step 1', 
            value: 'Join our Roblox game', 
            inline: false 
          },
          { 
            name: 'Step 2', 
            value: `Type \`/verify ${verificationCode}\` in the game chat`, 
            inline: false 
          },
          { 
            name: 'Step 3', 
            value: 'Your accounts will be linked automatically!', 
            inline: false 
          }
        )
        .addFields({
          name: '⏰ Verification Code',
          value: `\`\`\`${verificationCode}\`\`\``,
          inline: false
        })
        .setFooter({ text: `Code expires in 15 minutes` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error in /link command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Error')
        .setDescription('An error occurred while processing your request. Please try again later.');

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
