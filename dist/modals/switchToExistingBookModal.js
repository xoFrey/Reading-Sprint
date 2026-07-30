"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const bookProgress_1 = require("../services/bookProgress");
const Book_1 = require("../database/models/Book");
const SprintParticipant_1 = require("../database/models/SprintParticipant");
const sprintService_1 = require("../services/sprintService");
const participantPanelEmbed_1 = require("../embeds/participantPanelEmbed");
const joinMessageService_1 = require("../services/joinMessageService");
async function execute(interaction) {
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [participantId, bookId] = args;
    const book = await Book_1.Book.findById(bookId);
    const participant = await SprintParticipant_1.SprintParticipant.findById(participantId);
    const oldBook = participant ? (0, sprintService_1.getCurrentBook)(participant) : undefined;
    if (!book || !participant || !oldBook) {
        await interaction.reply({ content: texts_1.Texts.errors.generic, ephemeral: true });
        return;
    }
    const format = book.format;
    const total = format === "audiobook" ? book.totalMinutes : book.totalPages;
    const oldCurrent = (0, bookProgress_1.parseFormatValue)(oldBook.format, interaction.fields.getTextInputValue("oldCurrent"));
    const current = (0, bookProgress_1.parseFormatValue)(format, interaction.fields.getTextInputValue("current"));
    const goalRaw = interaction.fields.getTextInputValue("goal");
    const goalDelta = goalRaw ? (0, bookProgress_1.parseFormatValuePositive)(format, goalRaw) : null;
    if (current === null || (goalRaw && goalDelta === null)) {
        await interaction.reply({ content: texts_1.Texts.join.invalidValue, ephemeral: true });
        return;
    }
    if (format === "ebook" && (current < 0 || current > 100)) {
        await interaction.reply({ content: texts_1.Texts.join.invalidPercent, ephemeral: true });
        return;
    }
    if (current > total) {
        await interaction.reply({ content: texts_1.Texts.join.currentPageExceedsTotal, ephemeral: true });
        return;
    }
    // Erst den Fortschritt im BISHERIGEN Buch speichern (gleiche Validierung wie überall).
    const oldTotal = oldBook.format === "audiobook" ? oldBook.totalMinutes : oldBook.totalPages;
    const oldStart = oldBook.format === "audiobook"
        ? oldBook.startMinutes
        : oldBook.format === "ebook"
            ? oldBook.startPercent
            : oldBook.startPage;
    if (oldCurrent === null ||
        oldStart === undefined ||
        oldTotal === undefined ||
        oldCurrent < oldStart ||
        oldCurrent > oldTotal) {
        await interaction.reply({ content: texts_1.Texts.participant.updatePageInvalid, ephemeral: true });
        return;
    }
    await (0, sprintService_1.updateBookProgress)(participant, oldCurrent);
    const input = {
        title: book.title,
        format,
        current,
        total,
        goalDelta: goalDelta ?? undefined,
    };
    const updatedParticipant = await (0, sprintService_1.switchBook)(participantId, interaction.user.id, interaction.guildId, input);
    if (!updatedParticipant) {
        await interaction.reply({ content: texts_1.Texts.errors.notInSprint, ephemeral: true });
        return;
    }
    const { embed, components } = (0, participantPanelEmbed_1.buildParticipantPanel)(updatedParticipant);
    await interaction.reply({
        content: texts_1.Texts.participant.switchBookSuccess(book.title),
        embeds: [embed],
        components,
        ephemeral: true,
    });
    await (0, joinMessageService_1.refreshJoinMessage)(interaction.client, updatedParticipant.sprintId.toString());
}
