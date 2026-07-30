"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const leaderboardImageService_1 = require("../services/leaderboardImageService");
async function execute(interaction) {
    await interaction.deferUpdate();
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [pageStr] = args;
    const requestedPage = Number.parseInt(pageStr, 10);
    const totalPages = await (0, leaderboardImageService_1.getTotalLeaderboardPages)(interaction.guildId);
    const safePage = Math.min(Math.max(requestedPage, 1), totalPages);
    const entries = await (0, leaderboardImageService_1.buildLeaderboardEntries)(interaction.client, interaction.guildId, safePage);
    if (entries.length === 0) {
        await interaction.followUp({ content: texts_1.Texts.leaderboard.noData, ephemeral: true });
        return;
    }
    const imageBuffer = await (0, leaderboardImageService_1.buildLeaderboardImage)(entries, safePage, totalPages);
    const attachment = new discord_js_1.AttachmentBuilder(imageBuffer, { name: "leaderboard.png" });
    const row = (0, leaderboardImageService_1.buildLeaderboardPaginationRow)(safePage, totalPages);
    await interaction.editReply({ files: [attachment], components: row ? [row] : [] });
}
