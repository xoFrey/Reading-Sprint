"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARTICIPANTS_PAGE_SIZE = void 0;
exports.getTotalParticipantPages = getTotalParticipantPages;
exports.buildJoinEmbed = buildJoinEmbed;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const format_1 = require("../utils/format");
exports.PARTICIPANTS_PAGE_SIZE = 10;
function getTotalParticipantPages(participantCount) {
    return Math.max(1, Math.ceil(participantCount / exports.PARTICIPANTS_PAGE_SIZE));
}
function buildJoinEmbed(sprintId, durationMinutes, endTime, participants = [], page = 1) {
    const endUnix = Math.floor(endTime.getTime() / 1000);
    const totalPages = getTotalParticipantPages(participants.length);
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const pageParticipants = participants.slice((safePage - 1) * exports.PARTICIPANTS_PAGE_SIZE, safePage * exports.PARTICIPANTS_PAGE_SIZE);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(constants_1.Colors.success)
        .setTitle("🏁 Lese-Sprint gestartet!")
        .setDescription(texts_1.Texts.start.announcement((0, format_1.formatMinutes)(durationMinutes)))
        .addFields({
        name: "Ende",
        // Absolute Uhrzeit UND relative Angabe nebeneinander.
        value: `<t:${endUnix}:t> Uhr (<t:${endUnix}:R>) · Dauer: ${(0, format_1.formatMinutes)(durationMinutes)}`,
    });
    if (participants.length > 0) {
        const lines = pageParticipants.map((p) => `${p.paused ? "⏸️" : "📖"} <@${p.userId}> — ${p.bookTitle} (${p.progressLabel})`);
        const fieldName = totalPages > 1
            ? `Teilnehmer (${participants.length}) — Seite ${safePage}/${totalPages}`
            : `Teilnehmer (${participants.length})`;
        embed.addFields({ name: fieldName, value: lines.join("\n") });
    }
    const components = [];
    if (totalPages > 1) {
        const pageRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.JOIN_PARTICIPANTS_PAGE, sprintId, String(safePage - 1)))
            .setLabel("◀ Zurück")
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(safePage <= 1), new discord_js_1.ButtonBuilder()
            .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.JOIN_PARTICIPANTS_PAGE, sprintId, String(safePage + 1)))
            .setLabel("Weiter ▶")
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(safePage >= totalPages));
        components.push(pageRow);
    }
    const joinRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.SPRINT_JOIN, sprintId))
        .setLabel("Beitreten")
        .setEmoji("🙋")
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.SPRINT_MY_PANEL, sprintId))
        .setLabel(texts_1.Texts.join.myPanelButtonLabel)
        .setEmoji("📋")
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    components.push(joinRow);
    return { embed, components };
}
