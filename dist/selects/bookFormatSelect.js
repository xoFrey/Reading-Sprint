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
 * Reagiert auf die Format-Auswahl für ein NEUES Buch (Beitritt oder
 * Buchwechsel, siehe joinBookSelect.ts / switchBookSelect.ts). Baut je nach
 * gewähltem Format (Physisch/Ebook/Hörbuch) das passend beschriftete Modal.
 *
 * customId-Args: [mode, id] - mode ist "join" (id=sprintId) oder "switch"
 * (id=participantId, braucht zusätzlich das Format des BISHERIGEN Buchs für
 * die "alte Seite"-Abfrage).
 */
async function execute(interaction) {
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [mode, id] = args;
    const format = interaction.values[0];
    const titleInput = new discord_js_1.TextInputBuilder()
        .setCustomId("title")
        .setLabel(texts_1.Texts.join.bookTitleLabel)
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    const currentInput = new discord_js_1.TextInputBuilder()
        .setCustomId("current")
        .setLabel((0, bookProgress_1.getCurrentFieldLabel)(format))
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    const totalInput = new discord_js_1.TextInputBuilder()
        .setCustomId("total")
        .setLabel((0, bookProgress_1.getTotalFieldLabel)(format))
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    const goalInput = new discord_js_1.TextInputBuilder()
        .setCustomId("goal")
        .setLabel((0, bookProgress_1.getGoalFieldLabel)(format))
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(false);
    if (mode === "join") {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.MODAL_JOIN, id, format))
            .setTitle(texts_1.Texts.join.modalTitle);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(titleInput), new discord_js_1.ActionRowBuilder().addComponents(currentInput), new discord_js_1.ActionRowBuilder().addComponents(totalInput), new discord_js_1.ActionRowBuilder().addComponents(goalInput));
        await interaction.showModal(modal);
        return;
    }
    // mode === "switch": Format des BISHERIGEN Buchs wird gebraucht, um die
    // "alte Seite"-Abfrage korrekt zu beschriften.
    const participant = await SprintParticipant_1.SprintParticipant.findById(id);
    const oldBook = participant ? (0, sprintService_1.getCurrentBook)(participant) : undefined;
    const oldFormat = oldBook?.format ?? "physical";
    const oldCurrentInput = new discord_js_1.TextInputBuilder()
        .setCustomId("oldCurrent")
        .setLabel((0, bookProgress_1.getOldCurrentFieldLabel)(oldFormat))
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.MODAL_SWITCH_BOOK, id, format))
        .setTitle(texts_1.Texts.join.modalTitle);
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(oldCurrentInput), new discord_js_1.ActionRowBuilder().addComponents(titleInput), new discord_js_1.ActionRowBuilder().addComponents(currentInput), new discord_js_1.ActionRowBuilder().addComponents(totalInput), new discord_js_1.ActionRowBuilder().addComponents(goalInput));
    await interaction.showModal(modal);
}
