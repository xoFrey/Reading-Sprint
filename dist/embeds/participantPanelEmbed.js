"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildParticipantPanel = buildParticipantPanel;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const sprintService_1 = require("../services/sprintService");
const bookProgress_1 = require("../services/bookProgress");
/**
 * Baut das private (ephemeral) Panel, das ein Teilnehmer nach dem Beitritt sieht.
 * Wird nach jeder Aktion (Fortschritt ändern, Buch wechseln, ...) neu aufgebaut
 * und per interaction.update() aktualisiert.
 */
function buildParticipantPanel(participant) {
    const currentBook = (0, sprintService_1.getCurrentBook)(participant);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(constants_1.Colors.neutral)
        .setTitle("📖 Dein Sprint-Fortschritt");
    if (currentBook) {
        embed.addFields({ name: "Buch", value: `${currentBook.title} (${(0, bookProgress_1.formatLabel)(currentBook.format)})`, inline: true }, { name: "Stand", value: (0, bookProgress_1.formatCurrentProgress)(currentBook), inline: true }, { name: "Gelesen/Gehört in diesem Sprint", value: (0, bookProgress_1.formatDeltaProgress)(currentBook), inline: true });
        const goalText = (0, bookProgress_1.formatGoal)(currentBook);
        if (goalText) {
            embed.addFields({ name: "Ziel", value: goalText, inline: true });
        }
    }
    const statusLabel = participant.status === "paused" ? "⏸️ Pausiert" : "▶️ Aktiv";
    embed.setFooter({ text: statusLabel });
    const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.PARTICIPANT_UPDATE_PAGE, participant.id))
        .setLabel("Fortschritt aktualisieren")
        .setEmoji("✏️")
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.PARTICIPANT_SWITCH_BOOK, participant.id))
        .setLabel("Buch wechseln")
        .setEmoji("📖")
        .setStyle(discord_js_1.ButtonStyle.Secondary), participant.status === "paused"
        ? new discord_js_1.ButtonBuilder()
            .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.PARTICIPANT_RESUME, participant.id))
            .setLabel("Weiter")
            .setEmoji("▶️")
            .setStyle(discord_js_1.ButtonStyle.Success)
        : new discord_js_1.ButtonBuilder()
            .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.PARTICIPANT_PAUSE, participant.id))
            .setLabel("Pause")
            .setEmoji("⏸️")
            .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.PARTICIPANT_LEAVE, participant.id))
        .setLabel("Verlassen")
        .setEmoji("🚪")
        .setStyle(discord_js_1.ButtonStyle.Danger));
    return { embed, components: [row1] };
}
