"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const Sprint_1 = require("../database/models/Sprint");
const sprintEndImageService_1 = require("../services/sprintEndImageService");
async function execute(interaction) {
    await interaction.deferUpdate();
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [sprintId, pageStr] = args;
    const page = Number.parseInt(pageStr, 10);
    const sprint = await Sprint_1.Sprint.findById(sprintId);
    if (!sprint?.resultsSnapshot) {
        await interaction.followUp({ content: texts_1.Texts.errors.generic, ephemeral: true });
        return;
    }
    const results = sprint.resultsSnapshot;
    const totalPages = (0, sprintEndImageService_1.getTotalResultPages)(results.length);
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const imageBuffer = await (0, sprintEndImageService_1.buildSprintEndImage)(interaction.client, sprint.guildId, results, sprint.duration, safePage);
    const attachment = new discord_js_1.AttachmentBuilder(imageBuffer, { name: "sprint-ende.png" });
    const row = (0, sprintEndImageService_1.buildResultsPaginationRow)(sprintId, safePage, totalPages);
    await interaction.editReply({
        files: [attachment],
        components: row ? [row] : [],
    });
}
