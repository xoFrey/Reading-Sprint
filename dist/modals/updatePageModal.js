"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const bookProgress_1 = require("../services/bookProgress");
const SprintParticipant_1 = require("../database/models/SprintParticipant");
const sprintService_1 = require("../services/sprintService");
const participantPanelEmbed_1 = require("../embeds/participantPanelEmbed");
const joinMessageService_1 = require("../services/joinMessageService");
async function execute(interaction) {
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [participantId] = args;
    const participant = await SprintParticipant_1.SprintParticipant.findById(participantId);
    if (!participant) {
        await interaction.reply({ content: texts_1.Texts.errors.notInSprint, ephemeral: true });
        return;
    }
    const currentBook = (0, sprintService_1.getCurrentBook)(participant);
    if (!currentBook) {
        await interaction.reply({ content: texts_1.Texts.errors.notInSprint, ephemeral: true });
        return;
    }
    const newValue = (0, bookProgress_1.parseFormatValue)(currentBook.format, interaction.fields.getTextInputValue("current"));
    const start = currentBook.format === "audiobook"
        ? currentBook.startMinutes
        : currentBook.format === "ebook"
            ? currentBook.startPercent
            : currentBook.startPage;
    const total = currentBook.format === "audiobook" ? currentBook.totalMinutes : currentBook.totalPages;
    // Wert muss zwischen dem Startwert (kein Rückschritt) und dem Gesamtumfang
    // liegen (kein "999999 Seiten gelesen"-Cheat).
    if (newValue === null ||
        start === undefined ||
        total === undefined ||
        newValue < start ||
        newValue > total) {
        await interaction.reply({ content: texts_1.Texts.participant.updatePageInvalid, ephemeral: true });
        return;
    }
    await (0, sprintService_1.updateBookProgress)(participant, newValue);
    const { embed, components } = (0, participantPanelEmbed_1.buildParticipantPanel)(participant);
    await interaction.reply({
        content: texts_1.Texts.participant.updatePageSuccess,
        embeds: [embed],
        components,
        ephemeral: true,
    });
    await (0, joinMessageService_1.refreshJoinMessage)(interaction.client, participant.sprintId.toString());
}
