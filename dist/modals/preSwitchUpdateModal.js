"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const parsing_1 = require("../utils/parsing");
const SprintParticipant_1 = require("../database/models/SprintParticipant");
const sprintService_1 = require("../services/sprintService");
async function execute(interaction) {
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [participantId] = args;
    const newPage = (0, parsing_1.parsePositiveInt)(interaction.fields.getTextInputValue("currentPage"));
    const participant = await SprintParticipant_1.SprintParticipant.findById(participantId);
    if (!participant) {
        await interaction.reply({ content: texts_1.Texts.errors.notInSprint, ephemeral: true });
        return;
    }
    const currentBook = (0, sprintService_1.getCurrentBook)(participant);
    // Gleiche Validierung wie beim regulären "Seite aktualisieren" (siehe updatePageModal.ts):
    // kein Rückschritt, keine Seite jenseits der Gesamtseitenzahl.
    if (newPage === null ||
        !currentBook ||
        newPage < currentBook.startPage ||
        newPage > currentBook.totalPages) {
        await interaction.reply({ content: texts_1.Texts.participant.updatePageInvalid, ephemeral: true });
        return;
    }
    await (0, sprintService_1.updateCurrentPage)(participant, newPage);
    // Direkt das nächste Modal zeigen (Modal-Chaining): Discord erlaubt, auf eine
    // Modal-Submission mit einem weiteren Modal zu antworten. So bleibt der
    // Buchwechsel für den Nutzer ein durchgängiger Zwei-Schritte-Vorgang.
    const nextModal = new discord_js_1.ModalBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.MODAL_SWITCH_BOOK, participantId))
        .setTitle(texts_1.Texts.join.modalTitle);
    const titleInput = new discord_js_1.TextInputBuilder()
        .setCustomId("title")
        .setLabel(texts_1.Texts.join.bookTitleLabel)
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    const currentPageInput = new discord_js_1.TextInputBuilder()
        .setCustomId("currentPage")
        .setLabel(texts_1.Texts.join.currentPageLabel)
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    const totalPagesInput = new discord_js_1.TextInputBuilder()
        .setCustomId("totalPages")
        .setLabel(texts_1.Texts.join.totalPagesLabel)
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    const goalPageInput = new discord_js_1.TextInputBuilder()
        .setCustomId("goalPage")
        .setLabel(texts_1.Texts.join.goalPageLabel)
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(false);
    nextModal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(titleInput), new discord_js_1.ActionRowBuilder().addComponents(currentPageInput), new discord_js_1.ActionRowBuilder().addComponents(totalPagesInput), new discord_js_1.ActionRowBuilder().addComponents(goalPageInput));
    await interaction.showModal(nextModal);
}
