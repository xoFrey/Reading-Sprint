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
 * Sitzt auf der ÖFFENTLICHEN Kulanzzeit-Nachricht (siehe jobs/scheduler.ts).
 * Da diese Nachricht nicht an eine bestimmte Person gebunden ist, wird der
 * passende SprintParticipant erst beim Klick anhand von sprintId + eigener
 * userId gesucht - praktisch für den Fall, dass jemand sein privates
 * Teilnehmer-Panel versehentlich weggeklickt hat.
 */
async function execute(interaction) {
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [sprintId] = args;
    const participant = await SprintParticipant_1.SprintParticipant.findOne({
        sprintId,
        userId: interaction.user.id,
        status: { $ne: "left" },
    });
    if (!participant) {
        await interaction.reply({ content: texts_1.Texts.errors.notInSprint, ephemeral: true });
        return;
    }
    const currentBook = (0, sprintService_1.getCurrentBook)(participant);
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.MODAL_UPDATE_PAGE, participant.id))
        .setTitle(texts_1.Texts.participant.updatePageModalTitle);
    const valueInput = new discord_js_1.TextInputBuilder()
        .setCustomId("current")
        .setLabel(currentBook ? (0, bookProgress_1.getCurrentFieldLabel)(currentBook.format) : texts_1.Texts.participant.updatePageLabel)
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(valueInput));
    await interaction.showModal(modal);
}
