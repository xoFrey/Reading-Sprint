"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESULTS_PAGE_SIZE = void 0;
exports.getTotalResultPages = getTotalResultPages;
exports.buildSprintEndImage = buildSprintEndImage;
exports.buildResultsPaginationRow = buildResultsPaginationRow;
const discord_js_1 = require("discord.js");
const cardImageService_1 = require("./cardImageService");
const format_1 = require("../utils/format");
const bookProgress_1 = require("./bookProgress");
const texts_1 = require("../config/texts");
const constants_1 = require("../config/constants");
exports.RESULTS_PAGE_SIZE = 10;
function getTotalResultPages(resultCount) {
    return Math.max(1, Math.ceil(resultCount / exports.RESULTS_PAGE_SIZE));
}
/**
 * Baut EINE Seite des Sprint-Abschluss-Bilds über dieselbe Karten-Engine wie
 * das Leaderboard (siehe cardImageService.ts) - bewusst derselbe visuelle
 * Stil, inklusive Avatar-Bildern statt reiner Rangzahlen.
 *
 * Nimmt den Client statt einer Interaction entgegen, da dieser sowohl vom
 * manuellen Admin-Abbruch (endButton.ts), dem automatischen Scheduler
 * (jobs/scheduler.ts) als auch beim Blättern (sprintResultsPageButton.ts)
 * aufgerufen wird.
 *
 * @param results ALLE Ergebnisse (wird intern anhand von `page` geschnitten)
 * @param page 1-basierter Seitenindex
 */
async function buildSprintEndImage(client, guildId, results, sprintDurationMinutes, page = 1) {
    const totalPages = getTotalResultPages(results.length);
    const pageResults = results.slice((page - 1) * exports.RESULTS_PAGE_SIZE, page * exports.RESULTS_PAGE_SIZE);
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    const entries = [];
    for (const result of pageResults) {
        const member = await guild?.members.fetch(result.userId).catch(() => null);
        const discordUser = member?.user ??
            (await client.users.fetch(result.userId).catch(() => null));
        const displayName = member?.displayName ?? discordUser?.username ?? "Unbekannt";
        const avatarUrl = discordUser?.displayAvatarURL({
            extension: "png",
            size: 128,
        });
        const bookLines = result.books.map((book) => `${book.title} (${(0, bookProgress_1.formatLabel)(book.format)}): ${(0, bookProgress_1.formatDeltaWithGoal)(book)}`);
        const xpUntilNext = result.xpForNextLevel - result.currentLevelXP;
        const goalStatus = result.goalReached
            ? texts_1.Texts.sprintEnd.goalReached
            : texts_1.Texts.sprintEnd.goalMissed;
        const detailLines = [...bookLines];
        // Gesamt-Seitenzahl (Seiten-Äquivalent, im Hintergrund berechnet) nur als
        // eigene Zeile, wenn mehrere Bücher gelesen wurden - bei nur einem Buch
        // wäre das eine reine Wiederholung der Zeile oben.
        if (result.books.length > 1) {
            detailLines.push(`Gesamt: ${result.totalPagesRead} Seiten (Äquivalent)`);
        }
        detailLines.push(`${(0, format_1.formatMinutes)(result.minutesInSprint)}`, `+${result.xpEarned} XP`, `${xpUntilNext} XP bis Level ${result.newLevel + 1}`, goalStatus);
        if (result.leveledUp)
            detailLines.push(texts_1.Texts.sprintEnd.levelUp(result.newLevel));
        if (result.leftEarly)
            detailLines.push(texts_1.Texts.sprintEnd.leftEarly);
        entries.push({
            rank: result.placement,
            avatarUrl,
            boldLine: `#${result.placement} - ${displayName}`,
            detailLines,
        });
    }
    const subtitle = totalPages > 1
        ? `Geplante Dauer: ${(0, format_1.formatMinutes)(sprintDurationMinutes)} · Seite ${page}/${totalPages}`
        : `Geplante Dauer: ${(0, format_1.formatMinutes)(sprintDurationMinutes)}`;
    return (0, cardImageService_1.buildCardListImage)({ title: "Sprint beendet!", subtitle }, entries);
}
/**
 * Baut die Zurück/Weiter-Buttons fürs Blättern durch die Ergebnisse.
 * Gibt null zurück, wenn nur eine Seite existiert (keine Buttons nötig).
 */
function buildResultsPaginationRow(sprintId, page, totalPages) {
    if (totalPages <= 1)
        return null;
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.SPRINT_RESULTS_PAGE, sprintId, String(page - 1)))
        .setLabel("◀ Zurück")
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setDisabled(page <= 1), new discord_js_1.ButtonBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.SPRINT_RESULTS_PAGE, sprintId, String(page + 1)))
        .setLabel("Weiter ▶")
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setDisabled(page >= totalPages));
}
