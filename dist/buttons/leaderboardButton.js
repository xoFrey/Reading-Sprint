"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const texts_1 = require("../config/texts");
const leaderboardImageService_1 = require("../services/leaderboardImageService");
async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const totalPages = await (0, leaderboardImageService_1.getTotalLeaderboardPages)(interaction.guildId);
    const entries = await (0, leaderboardImageService_1.buildLeaderboardEntries)(interaction.client, interaction.guildId, 1);
    if (entries.length === 0) {
        await interaction.editReply({ content: texts_1.Texts.leaderboard.noData });
        return;
    }
    const imageBuffer = await (0, leaderboardImageService_1.buildLeaderboardImage)(entries, 1, totalPages);
    const attachment = new discord_js_1.AttachmentBuilder(imageBuffer, { name: "leaderboard.png" });
    const row = (0, leaderboardImageService_1.buildLeaderboardPaginationRow)(1, totalPages);
    await interaction.editReply({ files: [attachment], components: row ? [row] : [] });
}
