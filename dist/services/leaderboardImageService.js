"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEADERBOARD_PAGE_SIZE = void 0;
exports.getTotalLeaderboardPages = getTotalLeaderboardPages;
exports.buildLeaderboardEntries = buildLeaderboardEntries;
exports.buildLeaderboardImage = buildLeaderboardImage;
exports.buildLeaderboardPaginationRow = buildLeaderboardPaginationRow;
const discord_js_1 = require("discord.js");
const cardImageService_1 = require("./cardImageService");
const User_1 = require("../database/models/User");
const Book_1 = require("../database/models/Book");
const levelCurve_1 = require("../xp/levelCurve");
const constants_1 = require("../config/constants");
exports.LEADERBOARD_PAGE_SIZE = 10;
async function getTotalLeaderboardPages(guildId) {
    const count = await User_1.User.countDocuments({ guildId });
    return Math.max(1, Math.ceil(count / exports.LEADERBOARD_PAGE_SIZE));
}
/**
 * Lädt EINE Seite des serverweiten Leaderboards (alle Mitglieder, sortiert
 * nach Gesamt-XP absteigend) und baut daraus die Anzeige-Einträge inkl.
 * Rang, Avatar und aktuellem Buch. Wird sowohl beim ersten Öffnen als auch
 * beim Blättern (leaderboardPageButton.ts) verwendet.
 */
async function buildLeaderboardEntries(client, guildId, page) {
    const skip = (page - 1) * exports.LEADERBOARD_PAGE_SIZE;
    const users = await User_1.User.find({ guildId })
        .sort({ xp: -1 })
        .skip(skip)
        .limit(exports.LEADERBOARD_PAGE_SIZE);
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    const entries = [];
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const member = await guild?.members.fetch(user.discordId).catch(() => null);
        const discordUser = member?.user ?? (await client.users.fetch(user.discordId).catch(() => null));
        const displayName = member?.displayName ?? discordUser?.username ?? "Unbekannt";
        const avatarUrl = discordUser?.displayAvatarURL({ extension: "png", size: 128 });
        const currentBook = await Book_1.Book.findOne({ userId: user.discordId, guildId: user.guildId }).sort({
            updatedAt: -1,
        });
        const progress = (0, levelCurve_1.calculateLevelProgress)(user.xp);
        entries.push({
            rank: skip + i + 1,
            displayName,
            bookTitle: currentBook?.title ?? "—",
            pagesRead: user.totalPagesRead,
            level: progress.level,
            currentStreak: user.currentStreak,
            totalXP: user.xp,
            currentLevelXP: progress.currentLevelXP,
            xpForNextLevel: progress.xpForNextLevel,
            avatarUrl,
        });
    }
    return entries;
}
/**
 * Baut das Leaderboard-Bild über die gemeinsame Karten-Engine (siehe
 * cardImageService.ts) - dieselbe visuelle Sprache wie das Sprint-Abschluss-Bild.
 */
async function buildLeaderboardImage(entries, page, totalPages) {
    const cardEntries = entries.map((entry) => {
        const xpUntilNext = entry.xpForNextLevel - entry.currentLevelXP;
        return {
            rank: entry.rank,
            avatarUrl: entry.avatarUrl,
            boldLine: `#${entry.rank} - ${entry.displayName}`,
            detailLines: [
                entry.bookTitle,
                `${entry.pagesRead} Seiten`,
                `Level ${entry.level} — ${entry.currentLevelXP}/${entry.xpForNextLevel} XP (${xpUntilNext} bis Level ${entry.level + 1})`,
                `${entry.totalXP} XP insgesamt`,
                `Streak: ${entry.currentStreak} Tage`,
            ],
        };
    });
    const subtitle = totalPages > 1 ? `Seite ${page}/${totalPages}` : undefined;
    return (0, cardImageService_1.buildCardListImage)({ title: "Leaderboard", subtitle }, cardEntries);
}
/**
 * Baut die Zurück/Weiter-Buttons fürs Blättern durch das Leaderboard.
 * Gibt null zurück, wenn nur eine Seite existiert (keine Buttons nötig).
 */
function buildLeaderboardPaginationRow(page, totalPages) {
    if (totalPages <= 1)
        return null;
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.LEADERBOARD_PAGE, String(page - 1)))
        .setLabel("◀ Zurück")
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setDisabled(page <= 1), new discord_js_1.ButtonBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.LEADERBOARD_PAGE, String(page + 1)))
        .setLabel("Weiter ▶")
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setDisabled(page >= totalPages));
}
