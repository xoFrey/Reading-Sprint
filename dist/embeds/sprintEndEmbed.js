"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSprintEndEmbed = buildSprintEndEmbed;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const format_1 = require("../utils/format");
function buildSprintEndEmbed(results) {
    const embed = new discord_js_1.EmbedBuilder().setColor(constants_1.Colors.primary).setTitle(texts_1.Texts.sprintEnd.title);
    if (results.length === 0) {
        embed.setDescription(texts_1.Texts.sprintEnd.noParticipants);
        return embed;
    }
    const medals = ["🥇", "🥈", "🥉"];
    for (const result of results) {
        const medal = medals[result.placement - 1] ?? `#${result.placement}`;
        const bookLines = result.books
            .map((book) => `${book.title}: ${book.currentPage - book.startPage} Seiten`)
            .join("\n");
        const goalStatus = result.goalReached ? texts_1.Texts.sprintEnd.goalReached : texts_1.Texts.sprintEnd.goalMissed;
        const levelUpLine = result.leveledUp ? `\n${texts_1.Texts.sprintEnd.levelUp(result.newLevel)}` : "";
        const leftEarlyLine = result.leftEarly ? `\n${texts_1.Texts.sprintEnd.leftEarly}` : "";
        const xpUntilNext = result.xpForNextLevel - result.currentLevelXP;
        const statsLine = `⏱️ ${(0, format_1.formatMinutes)(result.minutesInSprint)} im Sprint · +${result.xpEarned} XP · ` +
            `${xpUntilNext} XP bis Level ${result.newLevel + 1}`;
        embed.addFields({
            name: `${medal} Platz ${result.placement} — ${result.totalPagesRead} Seiten gesamt`,
            value: `<@${result.userId}>\n${bookLines}\n${goalStatus} · ${statsLine}${levelUpLine}${leftEarlyLine}`,
        });
    }
    return embed;
}
