"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLeaderboardEmbed = buildLeaderboardEmbed;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const levelCurve_1 = require("../xp/levelCurve");
function buildLeaderboardEmbed(users) {
    const embed = new discord_js_1.EmbedBuilder().setColor(constants_1.Colors.primary).setTitle(texts_1.Texts.leaderboard.title);
    if (users.length === 0) {
        embed.setDescription(texts_1.Texts.leaderboard.noData);
        return embed;
    }
    // Nutzer sind bereits nach XP sortiert (siehe Aufrufer), Rang = Position in der Liste.
    users.forEach((user, index) => {
        const progress = (0, levelCurve_1.calculateLevelProgress)(user.xp);
        embed.addFields({
            name: `Platz #${index + 1}`,
            value: `<@${user.discordId}>\n${texts_1.Texts.leaderboard.entry(index + 1, progress.level, progress.currentLevelXP, progress.xpForNextLevel, user.xp)}`,
        });
    });
    return embed;
}
