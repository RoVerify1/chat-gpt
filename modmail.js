/**
 * XerionX Modmail System
 * Handles DM forwarding to staff channel
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config');
const utils = require('./utils');

// Store active modmail sessions: Map<userId, { thread, lastMessage }>
const activeSessions = new Map();

/**
 * Handle incoming DM from user
 */
async function handleUserDM(client, message) {
    // Ignore bot messages
    if (message.author.bot) return;
    
    const userId = message.author.id;
    const modmailChannelId = config.CHANNELS.MODMAIL_CHANNEL;
    
    if (!modmailChannelId) {
        utils.log('Modmail channel not configured', 'ERROR');
        return;
    }
    
    const modmailChannel = client.channels.cache.get(modmailChannelId);
    if (!modmailChannel) {
        utils.log('Modmail channel not found', 'ERROR');
        try {
            await message.author.send('❌ Modmail system is currently unavailable. Please try again later.');
        } catch (e) {}
        return;
    }
    
    // Check if session exists
    let session = activeSessions.get(userId);
    
    if (!session) {
        // Create new session
        const embed = new EmbedBuilder()
            .setColor(config.BOT.EMBED_COLOR)
            .setTitle('📬 New Modmail')
            .setDescription(`**User:** ${message.author.tag}\n**ID:** ${message.author.id}\n**Created:** <t:${Math.floor(message.author.createdTimestamp / 1000)}:R>`)
            .setFooter({ text: `User ID: ${userId}` })
            .setTimestamp();
        
        // Add first message content
        const messageEmbed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setDescription(message.content || '(No content - possibly an attachment)')
            .setFooter({ text: 'First Message' })
            .setTimestamp();
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_modmail')
                    .setLabel('Close Conversation')
                    .setStyle(ButtonStyle.Danger)
            );
        
        try {
            const thread = await modmailChannel.send({
                content: `🔔 **New modmail from ${message.author.tag}**`,
                embeds: [embed, messageEmbed],
                components: [row],
                files: message.attachments.map(a => a.url)
            });
            
            session = {
                thread: thread,
                createdAt: Date.now(),
                messages: [{ from: 'user', content: message.content, timestamp: Date.now() }]
            };
            
            activeSessions.set(userId, session);
            
            // Send confirmation to user
            await message.author.send({
                embeds: [new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Message Sent')
                    .setDescription('Your message has been sent to our staff team. We will respond as soon as possible.')
                    .setFooter({ text: 'You will receive replies in DMs' })]
            });
            
            utils.log(`New modmail session created for ${message.author.tag}`, 'MODMAIL');
        } catch (error) {
            utils.log(`Failed to create modmail thread: ${error.message}`, 'ERROR');
        }
    } else {
        // Forward to existing thread
        try {
            const messageEmbed = new EmbedBuilder()
                .setColor(0x2F3136)
                .setDescription(message.content || '(No content - possibly an attachment)')
                .setFooter({ text: message.author.tag })
                .setTimestamp();
            
            await session.thread.send({
                embeds: [messageEmbed],
                files: message.attachments.map(a => a.url)
            });
            
            session.messages.push({
                from: 'user',
                content: message.content,
                timestamp: Date.now()
            });
            
            utils.log(`Message forwarded from ${message.author.tag}`, 'MODMAIL');
        } catch (error) {
            utils.log(`Failed to forward message: ${error.message}`, 'ERROR');
            // Session might be deleted, remove it
            activeSessions.delete(userId);
        }
    }
}

/**
 * Handle staff reply command
 */
async function replyToUser(client, userId, messageContent, replyingStaff) {
    const session = activeSessions.get(userId);
    
    if (!session) {
        return { success: false, message: 'No active conversation with this user.' };
    }
    
    try {
        const user = await client.users.fetch(userId);
        
        const replyEmbed = new EmbedBuilder()
            .setColor(0x00AA00)
            .setTitle('📨 Staff Reply')
            .setDescription(messageContent)
            .setFooter({ text: `Reply from ${replyingStaff.tag}` })
            .setTimestamp();
        
        await user.send({ embeds: [replyEmbed] });
        
        // Log to thread
        const logEmbed = new EmbedBuilder()
            .setColor(0x00AA00)
            .setDescription(`✅ Reply sent to ${user.tag}`)
            .setFooter({ text: replyingStaff.tag })
            .setTimestamp();
        
        await session.thread.send({ embeds: [logEmbed] });
        
        session.messages.push({
            from: 'staff',
            content: messageContent,
            author: replyingStaff.tag,
            timestamp: Date.now()
        });
        
        utils.log(`Staff reply sent to ${user.tag} by ${replyingStaff.tag}`, 'MODMAIL');
        return { success: true, message: 'Reply sent successfully.' };
    } catch (error) {
        utils.log(`Failed to send reply: ${error.message}`, 'ERROR');
        return { success: false, message: `Failed to send reply: ${error.message}` };
    }
}

/**
 * Close modmail session
 */
async function closeSession(userId, client) {
    const session = activeSessions.get(userId);
    
    if (!session) {
        return { success: false, message: 'No active session found.' };
    }
    
    try {
        // Try to fetch the user
        let userTag = 'Unknown User';
        try {
            const user = await client.users.fetch(userId);
            userTag = user.tag;
        } catch (e) {}
        
        // Send final message to thread
        const closeEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🔒 Conversation Closed')
            .setDescription(`Conversation with **${userTag}** has been closed.`)
            .addFields(
                { name: 'Duration', value: `${Math.round((Date.now() - session.createdAt) / 60000)} minutes`, inline: true },
                { name: 'Messages', value: `${session.messages.length}`, inline: true }
            )
            .setTimestamp();
        
        await session.thread.send({ embeds: [closeEmbed], components: [] });
        
        activeSessions.delete(userId);
        utils.log(`Modmail session closed for ${userTag}`, 'MODMAIL');
        return { success: true, message: 'Session closed successfully.' };
    } catch (error) {
        utils.log(`Error closing session: ${error.message}`, 'ERROR');
        activeSessions.delete(userId);
        return { success: false, message: error.message };
    }
}

/**
 * Get all active sessions
 */
function getActiveSessions() {
    return Array.from(activeSessions.entries()).map(([userId, session]) => ({
        userId,
        createdAt: session.createdAt,
        messageCount: session.messages.length
    }));
}

module.exports = {
    handleUserDM,
    replyToUser,
    closeSession,
    getActiveSessions,
    activeSessions
};
