"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const SprintParticipant_1 = require("../database/models/SprintParticipant");
const sprintService_1 = require("../services/sprintService");
const bookProgress_1 = require("../services/bookProgress");
/**
 * Fragt (wie graceUpdatePageButton.ts) den Teilnehmer-Datensatz ab, um das
 * Modal-Feld format-abhängig zu beschriften (Seite/Prozent/Std:Min).
 */
async function execute(interaction) {
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [participantId] = args;
    const participant = await SprintParticipant_1.SprintParticipant.findById(participantId);
    const currentBook = participant ? (0, sprintService_1.getCurrentBook)(participant) : undefined;
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.MODAL_UPDATE_PAGE, participantId))
        .setTitle(texts_1.Texts.participant.updatePageModalTitle);
    const valueInput = new discord_js_1.TextInputBuilder()
        .setCustomId("current")
        .setLabel(currentBook ? (0, bookProgress_1.getCurrentFieldLabel)(currentBook.format) : texts_1.Texts.participant.updatePageLabel)
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(valueInput));
    await interaction.showModal(modal);
}
