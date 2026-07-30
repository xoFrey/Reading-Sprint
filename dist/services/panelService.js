"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpcomingSprints = getUpcomingSprints;
exports.refreshPanel = refreshPanel;
const Guild_1 = require("../database/models/Guild");
const ScheduledSprint_1 = require("../database/models/ScheduledSprint");
const panelEmbed_1 = require("../embeds/panelEmbed");
const constants_1 = require("../config/constants");
/**
 * Lädt die geplanten Sprints eines Servers, sortiert nach Startzeit.
 * Wird sowohl beim initialen Posten (/reading-panel) als auch bei jeder
 * Aktualisierung (refreshPanel) verwendet, damit beide Stellen garantiert
 * dieselbe Liste zeigen.
 */
async function getUpcomingSprints(guildId) {
    return ScheduledSprint_1.ScheduledSprint.find({ guildId, status: "scheduled" })
        .sort({ scheduledStart: 1 })
        .limit(constants_1.MAX_UPCOMING_SPRINTS_SHOWN);
}
/**
 * Baut das Panel-Embed neu und aktualisiert die gepostete Nachricht per edit().
 * Wird aufgerufen, sobald sich die Liste der geplanten Sprints ändert
 * (neu geplant, gestartet, oder vom Scheduler ausgelöst).
 *
 * Macht nichts, falls für den Server noch kein Panel gepostet wurde
 * (Guild.panelChannelId/panelMessageId nicht gesetzt).
 */
async function refreshPanel(client, guildId) {
    const guild = await Guild_1.Guild.findOne({ guildId });
    if (!guild?.panelChannelId || !guild.panelMessageId) {
        console.log(`[Panel] Kein gespeichertes Panel für Guild ${guildId} gefunden.`);
        return;
    }
    const channel = await client.channels.fetch(guild.panelChannelId).catch((error) => {
        console.error(`[Panel] Channel ${guild.panelChannelId} konnte nicht geladen werden:`, error);
        return null;
    });
    if (!channel?.isTextBased()) {
        console.log(`[Panel] Channel ${guild.panelChannelId} ist nicht text-basiert oder existiert nicht mehr.`);
        return;
    }
    const message = await channel.messages
        .fetch(guild.panelMessageId)
        .catch((error) => {
        console.error(`[Panel] Nachricht ${guild.panelMessageId} konnte nicht geladen werden:`, error);
        return null;
    });
    if (!message)
        return;
    const upcomingSprints = await getUpcomingSprints(guildId);
    console.log(`[Panel] Aktualisiere Panel mit ${upcomingSprints.length} geplanten Sprint(s).`);
    const { embed, components } = (0, panelEmbed_1.buildPanelEmbed)(upcomingSprints);
    await message.edit({ embeds: [embed], components });
}
