"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const bookProgress_1 = require("../services/bookProgress");
const Book_1 = require("../database/models/Book");
const Sprint_1 = require("../database/models/Sprint");
const SprintParticipant_1 = require("../database/models/SprintParticipant");
const sprintService_1 = require("../services/sprintService");
const participantPanelEmbed_1 = require("../embeds/participantPanelEmbed");
const joinMessageService_1 = require("../services/joinMessageService");
async function execute(interaction) {
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [sprintId, bookId] = args;
    const book = await Book_1.Book.findById(bookId);
    if (!book) {
        await interaction.reply({ content: texts_1.Texts.myBooks.notFound, ephemeral: true });
        return;
    }
    const format = book.format;
    const total = format === "audiobook" ? book.totalMinutes : book.totalPages;
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
    const sprint = await Sprint_1.Sprint.findById(sprintId);
    if (!sprint || sprint.status !== "active") {
        await interaction.reply({ content: texts_1.Texts.end.sprintOver, ephemeral: true });
        return;
    }
    const input = {
        title: book.title,
        format,
        current,
        total,
        goalDelta: goalDelta ?? undefined,
    };
    let participant;
    try {
        // findOrCreateBook in joinSprint findet dieses Buch anhand des Titels
        // wieder (gleicher Nutzer, gleicher Server, unbeendet) - Titel/Umfang
        // müssen daher nicht erneut eingegeben werden.
        participant = await (0, sprintService_1.joinSprint)(sprintId, interaction.user.id, interaction.guildId, input);
    }
    catch (error) {
        if (error?.code === 11000) {
            const existing = await SprintParticipant_1.SprintParticipant.findOne({ sprintId, userId: interaction.user.id });
            const message = existing?.status === "left" ? texts_1.Texts.join.alreadyLeft : texts_1.Texts.join.alreadyJoined;
            await interaction.reply({ content: message, ephemeral: true });
            return;
        }
        throw error;
    }
    const { embed, components } = (0, participantPanelEmbed_1.buildParticipantPanel)(participant);
    await interaction.reply({
        content: texts_1.Texts.join.welcome(book.title),
        embeds: [embed],
        components,
        ephemeral: true,
    });
    await (0, joinMessageService_1.refreshJoinMessage)(interaction.client, sprintId);
}
