/**
 * Premium UI Embeds für XerionX Bot
 * Hochwertige, moderne Embed-Designs im Roblox Premium Stil
 */

const { EmbedBuilder } = require('discord.js');
const config = require('./config');

class EmbedFactory {
    /**
     * Erstellt ein Basis-Embed mit dem XerionX Design
     */
    static createBaseEmbed(options = {}) {
        const embed = new EmbedBuilder()
            .setColor(options.color || config.colors.primary)
            .setFooter({
                text: `${config.botName} • Premium Discord Bot`,
                iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
            })
            .setTimestamp();

        if (options.title) embed.setTitle(options.title);
        if (options.description) embed.setDescription(options.description);
        if (options.thumbnail) embed.setThumbnail(options.thumbnail);
        if (options.image) embed.setImage(options.image);
        if (options.author) embed.setAuthor(options.author);

        return embed;
    }

    /**
     * Welcome Embed - Begrüßung neuer Mitglieder
     */
    static createWelcomeEmbed(member, guild) {
        return this.createBaseEmbed({
            color: config.colors.success,
            title: `${config.emojis.hand} Willkommen auf ${guild.name}!`,
            description: `Hey ${member.user}, wir freuen uns, dich bei uns zu haben!\n\n` +
                `**Was kannst du tun?**\n` +
                `${config.emojis.ticket} Öffne ein Ticket für Support\n` +
                `${config.emojis.shop} Besuche unseren Shop\n` +
                `${config.emojis.roblox} Verifiziere deinen Roblox Account\n` +
                `${config.emojis.star} Sammle XP und steige auf!\n\n` +
                `Lies dir bitte die <#rules> durch und genieße deinen Aufenthalt!`,
            thumbnail: member.user.displayAvatarURL({ size: 256, extension: 'png' })
        })
        .addFields([
            { name: `${config.emojis.info} Mitglied Nr.`, value: `**${member.user.createdTimestamp < Date.now() - 2592000000 ? guild.memberCount : 'Neu'}**`, inline: true },
            { name: `${config.emojis.calendar} Account erstellt`, value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: `${config.emojis.clock} Beitritt`, value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        ]);
    }

    /**
     * Leave Embed - Wenn ein Member den Server verlässt
     */
    static createLeaveEmbed(member, guild) {
        return this.createBaseEmbed({
            color: config.colors.error,
            title: `${config.emojis.cross} Mitglied verlassen`,
            description: `${member.user.tag} hat den Server verlassen.`,
            thumbnail: member.user.displayAvatarURL({ size: 256, extension: 'png' })
        })
        .addFields([
            { name: 'Mitglied seit', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
            { name: 'Account erstellt', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
        ]);
    }

    /**
     * Shop Hauptmenü Embed
     */
    static createShopEmbed() {
        const categories = config.shopCategories.map(cat => 
            `${cat.icon} **${cat.name}**\n${cat.id === 'vip' ? 'Exklusive Premium-Produkte' : 'Hochwertige digitale Produkte'}\n`
        ).join('\n');

        return this.createBaseEmbed({
            color: config.colors.premium,
            title: `${config.emojis.shop} ${config.shopName}`,
            description: '**Willkommen im Premium Shop!**\n\n' +
                'Wähle eine Kategorie aus dem Dropdown-Menü unten, um unsere Produkte zu entdecken.\n\n' +
                `${config.emojis.gem} **Warum bei uns kaufen?**\n` +
                '• Sofortige automatische Lieferung\n' +
                '• Sichere Zahlung über Roblox\n' +
                '• 24/7 Support\n' +
                '• Premium Qualität\n\n' +
                '**Kategorien:**\n' + categories,
            image: 'https://cdn.discordapp.com/attachments/shop-banner.png'
        });
    }

    /**
     * Produkt Embed - Zeigt ein einzelnes Produkt an
     */
    static createProductEmbed(product) {
        const discountPrice = product.discount > 0 
            ? Math.round(product.price * (1 - product.discount / 100)) 
            : null;

        return this.createBaseEmbed({
            color: product.featured ? config.colors.premium : config.colors.primary,
            title: `${product.featured ? config.emojis.crown : ''} ${product.name}`,
            description: product.description,
            thumbnail: product.images?.[0] || null
        })
        .addFields([
            { name: `${config.emojis.money} Preis`, value: discountPrice 
                ? `~~${product.price} ${product.currency}~~ **${discountPrice} ${product.currency}** (${product.discount}% Rabatt)` 
                : `**${product.price} ${product.currency}**`, inline: true },
            { name: `${config.emojis.box} Lager`, value: product.stock === -1 ? '∞ Unbegrenzt' : `**${product.stock}** verfügbar`, inline: true },
            { name: `${config.emojis.star} Verkäufe`, value: `**${product.sales}**`, inline: true },
            { name: `${config.emojis.tag} Kategorie`, value: `\`${product.category}\``, inline: true },
            { name: `${config.emojis.truck} Lieferung`, value: `\`${product.deliveryType}\``, inline: true }
        ])
        .setFooter({ text: `Produkt-ID: ${product.productId} • ${config.shopName}` });
    }

    /**
     * Kaufbestätigung Embed
     */
    static createOrderEmbed(order, paymentCode) {
        return this.createBaseEmbed({
            color: config.colors.warning,
            title: `${config.emojis.gift} Bestellung bestätigt!`,
            description: `Danke für deinen Einkauf bei ${config.shopName}!\n\n` +
                `**Bitte folge diesen Schritten:**\n\n` +
                `1. Sende **${paymentCode}** als Roblox Gamepass an <@${order.userId}>\n` +
                `2. Warte auf die automatische Bestätigung\n` +
                `3. Dein Produkt wird sofort geliefert!\n\n` +
                `${config.emojis.warning} **Wichtig:** Der Code ist nur für diese Bestellung gültig!`,
        })
        .addFields([
            { name: `${config.emojis.receipt} Bestellnummer`, value: `\`${order.orderId}\``, inline: true },
            { name: `${config.emojis.money} Gesamtbetrag`, value: `**${order.totalAmount} ROBUX**`, inline: true },
            { name: `${config.emojis.clock} Status`, value: '**Ausstehend**', inline: true }
        ]);
    }

    /**
     * Ticket Erstellungs-Embed
     */
    static createTicketPanelEmbed() {
        const categories = config.ticketCategories.map(cat =>
            `${cat.name} - ${cat.description}`
        ).join('\n');

        return this.createBaseEmbed({
            color: config.colors.info,
            title: `${config.emojis.ticket} Support Center`,
            description: '**Willkommen im Support Center!**\n\n' +
                'Bei Fragen, Problemen oder Anliegen eröffne bitte ein Ticket.\n\n' +
                `${config.emojis.shield} **Unser Team hilft dir gerne bei:**\n` +
                categories + '\n\n' +
                'Klicke auf den Button unten und wähle deine Kategorie.',
            image: 'https://cdn.discordapp.com/attachments/ticket-banner.png'
        });
    }

    /**
     * Ticket Erstellt Embed
     */
    static createTicketCreatedEmbed(ticket, category) {
        return this.createBaseEmbed({
            color: config.colors.success,
            title: `${config.emojis.ticket} Ticket erstellt!`,
            description: `Dein Ticket **#${ticket.ticketNumber}** wurde erfolgreich erstellt.\n\n` +
                `**Kategorie:** ${category}\n` +
                `**Status:** Offen\n\n` +
                'Bitte beschreibe dein Anliegen so detailliert wie möglich.\n' +
                'Ein Staff-Mitarbeiter wird sich bald bei dir melden.',
        })
        .addFields([
            { name: 'Ticket ID', value: `\`${ticket.ticketId}\``, inline: true },
            { name: 'Erstellt', value: '<t:' + Math.floor(Date.now() / 1000) + ':R>', inline: true }
        ]);
    }

    /**
     * Ticket Info Embed (für Staff)
     */
    static createTicketInfoEmbed(ticket) {
        return this.createBaseEmbed({
            color: config.colors.primary,
            title: `${config.emojis.info} Ticket Informationen`,
        })
        .addFields([
            { name: 'Ticket Nummer', value: `**#${ticket.ticketNumber}**`, inline: true },
            { name: 'Status', value: `**${ticket.status}**`, inline: true },
            { name: 'Kategorie', value: `\`${ticket.category}\``, inline: true },
            { name: 'User', value: `<@${ticket.userId}>`, inline: true },
            { name: 'Geöffnet', value: `<t:${Math.floor(ticket.openedAt / 1000)}:R>`, inline: true },
            { name: 'Beansprucht von', value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Niemand', inline: true }
        ]);
    }

    /**
     * Roblox Verification Embed
     */
    static createVerificationEmbed(verificationCode) {
        return this.createBaseEmbed({
            color: config.colors.roblox,
            title: `${config.emojis.roblox} Roblox Verifizierung`,
            description: '**Verifiziere deinen Roblox Account!**\n\n' +
                'Um Zugang zu exklusiven Features zu erhalten, verifiziere bitte deinen Roblox Account.\n\n' +
                `**Dein Verifizierungscode:**\n` +
                `## \`${verificationCode}\`\n\n` +
                '**Anleitung:**\n' +
                '1. Gehe auf Roblox und öffne dein Profil\n' +
                '2. Ändere deinen "Über mich" Text ODER deinen Benutzernamen temporär\n' +
                '3. Füge den Code oben ein\n' +
                '4. Klicke auf "Verifizieren"',
            image: 'https://cdn.discordapp.com/attachments/roblox-verify.png'
        });
    }

    /**
     * Roblox Profil Embed
     */
    static createRobloxProfileEmbed(userData) {
        return this.createBaseEmbed({
            color: config.colors.roblox,
            title: `${config.emojis.roblox} ${userData.displayName || userData.name}`,
            thumbnail: userData.avatarUrl,
        })
        .addFields([
            { name: 'Benutzername', value: `\`${userData.name}\``, inline: true },
            { name: 'Display Name', value: `\`${userData.displayName || 'N/A'}\``, inline: true },
            { name: 'User ID', value: `\`${userData.id}\``, inline: true },
            { name: 'Beschreibung', value: userData.description || '*Keine Beschreibung*', inline: false },
            { name: 'Erstellt', value: `<t:${Math.floor(new Date(userData.created).getTime() / 1000)}:R>`, inline: true },
            { name: 'Verifiziert', value: config.emojis.check + ' Ja', inline: true }
        ]);
    }

    /**
     * Level Up Embed
     */
    static createLevelUpEmbed(user, newLevel) {
        return this.createBaseEmbed({
            color: config.colors.premium,
            title: `${config.emojis.fire} Level Up!`,
            description: `Glückwunsch ${user.username}! Du hast **Level ${newLevel}** erreicht!\n\n` +
                `${config.emojis.star} Weiter so!`,
            thumbnail: user.avatarURL
        })
        .addFields([
            { name: 'Aktuelles Level', value: `**${newLevel}**`, inline: true },
            { name: 'Gesamt-XP', value: `**${user.xp} XP**`, inline: true },
            { name: 'Nachrichten', value: `**${user.messagesSent}**`, inline: true }
        ]);
    }

    /**
     * Hilfe / Help Embed
     */
    static createHelpEmbed() {
        return this.createBaseEmbed({
            color: config.colors.info,
            title: `${config.emojis.info} ${config.botName} Hilfe`,
            description: '**Willkommen beim Hilfe-Menü!**\n\n' +
                'Wähle eine Kategorie aus dem Dropdown-Menü unten, um alle Commands zu sehen.\n\n' +
                `${config.emojis.shield} **Bot Features:**\n` +
                '• Modernes Ticket & ModMail System\n' +
                '• Integrierter Premium Shop\n' +
                '• Roblox Integration & Verifizierung\n' +
                '• Level System mit XP\n' +
                '• Umfangreiche Moderation\n' +
                '• AutoMod Schutz\n' +
                '• Welcome & Leave System',
        })
        .addFields([
            { name: `${config.emojis.shop} Shop Commands`, value: '`/shop` `/buy` `/inventory` `/orders`', inline: false },
            { name: `${config.emojis.ticket} Ticket Commands`, value: '`/ticket` `/close` `/claim`', inline: false },
            { name: `${config.emojis.roblox} Roblox Commands`, value: '`/link` `/roblox`', inline: false },
            { name: `${config.emojis.sword} Moderation`, value: '`/ban` `/kick` `/mute` `/warn` `/purge`', inline: false },
            { name: `${config.emojis.star} Utility`, value: '`/help` `/ping` `/userinfo` `/serverinfo`', inline: false }
        ]);
    }

    /**
     * Error Embed
     */
    static createErrorEmbed(message) {
        return this.createBaseEmbed({
            color: config.colors.error,
            title: `${config.emojis.cross} Fehler`,
            description: message
        });
    }

    /**
     * Success Embed
     */
    static createSuccessEmbed(message) {
        return this.createBaseEmbed({
            color: config.colors.success,
            title: `${config.emojis.check} Erfolg`,
            description: message
        });
    }

    /**
     * Warning Embed
     */
    static createWarningEmbed(message) {
        return this.createBaseEmbed({
            color: config.colors.warning,
            title: `${config.emojis.warning} Warnung`,
            description: message
        });
    }

    /**
     * Stats Embed - Bot Statistiken
     */
    static createStatsEmbed(client, stats) {
        return this.createBaseEmbed({
            color: config.colors.primary,
            title: `${config.emojis.robot} ${config.botName} Statistiken`,
        })
        .addFields([
            { name: 'Server', value: `**${client.guilds.cache.size}**`, inline: true },
            { name: 'User', value: `**${stats.totalUsers}**`, inline: true },
            { name: 'Tickets', value: `**${stats.tickets}**`, inline: true },
            { name: 'Produkte', value: `**${stats.products}**`, inline: true },
            { name: 'Bestellungen', value: `**${stats.orders}**`, inline: true },
            { name: 'Uptime', value: `**${stats.uptime}**`, inline: true }
        ]);
    }
}

module.exports = EmbedFactory;
