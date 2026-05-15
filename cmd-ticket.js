/**
 * Command: Ticket - Erstellt ein Support Ticket
 * /ticket [category]
 */

const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config');
const EmbedFactory = require('./embeds');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('🎫 Erstelle ein Support Ticket')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Erstelle ein neues Ticket')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Schließe dein aktuelles Ticket')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('Beanspruche ein Ticket (Staff)')
        ),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'create') {
            await handleTicketCreate(interaction);
        } else if (subcommand === 'close') {
            await handleTicketClose(interaction);
        } else if (subcommand === 'claim') {
            await handleTicketClaim(interaction);
        }
    }
};

/**
 * Handler für /ticket create
 */
async function handleTicketCreate(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const { Ticket } = require('./database');
    
    // Prüfe ob User schon ein offenes Ticket hat
    const existingTicket = await Ticket.findOne({
        userId: interaction.user.id,
        status: 'open'
    });
    
    if (existingTicket) {
        return interaction.editReply({
            embeds: [EmbedFactory.createWarningEmbed(
                `Du hast bereits ein offenes Ticket: <#${existingTicket.channelId}>\n\n` +
                `Bitte schließe zuerst dein bestehendes Ticket.`
            )]
        });
    }
    
    // Erstelle Ticket Panel Embed
    const panelEmbed = EmbedFactory.createTicketPanelEmbed();
    
    // Erstelle Select Menu für Kategorien
    const categorySelect = new StringSelectMenuBuilder()
        .setCustomId('ticket_category')
        .setPlaceholder('Wähle deine Kategorie...')
        .addOptions(config.ticketCategories.map(cat => ({
            label: cat.name.replace(/^[^\s]+ /, ''),
            value: cat.id,
            emoji: cat.name.split(' ')[0],
            description: cat.description.substring(0, 100)
        })));
    
    const selectRow = new ActionRowBuilder().addComponents(categorySelect);
    
    await interaction.editReply({
        content: '**🎫 Support Center**\nWähle unten die passende Kategorie für dein Anliegen:',
        embeds: [panelEmbed],
        components: [selectRow]
    });
}

/**
 * Handler für /ticket close
 */
async function handleTicketClose(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const { Ticket } = require('./database');
    
    // Suche Ticket für diesen Channel oder User
    const ticket = await Ticket.findOne({
        $or: [
            { channelId: interaction.channel.id },
            { userId: interaction.user.id, status: 'open' }
        ]
    });
    
    if (!ticket) {
        return interaction.editReply({
            embeds: [EmbedFactory.createErrorEmbed('Kein offenes Ticket gefunden!')]
        });
    }
    
    // Bestätige Close
    const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_close_confirm')
            .setLabel('Ja, schließen')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('ticket_close_cancel')
            .setLabel('Abbrechen')
            .setStyle(ButtonStyle.Secondary)
    );
    
    await interaction.editReply({
        content: 'Möchtest du dieses Ticket wirklich schließen?',
        components: [confirmRow]
    });
}

/**
 * Handler für /ticket claim (Staff only)
 */
async function handleTicketClaim(interaction) {
    await interaction.deferReply({ ephemeral: false });
    
    const { Ticket } = require('./database');
    
    // Nur Staff können claimen (einfache Permission Check)
    if (!interaction.member.permissions.has('ManageMessages')) {
        return interaction.editReply({
            embeds: [EmbedFactory.createErrorEmbed('Nur Staff-Mitarbeiter können Tickets beanspruchen!')]
        });
    }
    
    const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
    
    if (!ticket) {
        return interaction.editReply({
            embeds: [EmbedFactory.createErrorEmbed('Dieser Channel ist kein Ticket!')]
        });
    }
    
    if (ticket.status === 'claimed' && ticket.claimedBy === interaction.user.id) {
        return interaction.editReply({
            embeds: [EmbedFactory.createWarningEmbed('Du hast dieses Ticket bereits beansprucht!')]
        });
    }
    
    // Update Ticket
    ticket.claimedBy = interaction.user.id;
    ticket.status = 'claimed';
    await ticket.save();
    
    // Setze Channel Topic
    await interaction.channel.setTopic(`🔒 Beansprucht von ${interaction.user.tag}`).catch(() => {});
    
    await interaction.editReply({
        embeds: [EmbedFactory.createSuccessEmbed(
            `${interaction.user} hat dieses Ticket beansprucht!\n\n` +
            `Das Team wurde informiert.`
        )]
    });
    
    // Benachrichtige User im Ticket
    try {
        const user = await interaction.client.users.fetch(ticket.userId);
        await user.send({
            embeds: [EmbedFactory.createBaseEmbed({
                color: config.colors.info,
                title: '📋 Ticket beansprucht',
                description: `Ein Staff-Mitarbeiter (**${interaction.user.tag}**) hat dein Ticket übernommen und wird sich bald bei dir melden!`
            })]
        }).catch(() => {});
    } catch (error) {
        // Ignoriere wenn DM nicht gesendet werden kann
    }
}
