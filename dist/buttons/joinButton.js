"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const bookService_1 = require("../services/bookService");
const bookProgress_1 = require("../services/bookProgress");
const Sprint_1 = require("../database/models/Sprint");
const SprintParticipant_1 = require("../database/models/SprintParticipant");
/**
 * Zeigt zuerst eine Dropdown-Auswahl der unbeendeten Bücher aus der
 * persönlichen Bibliothek (siehe bookService.getUnfinishedBooks), damit ein
 * Buch aus einem vorherigen Sprint fortgesetzt werden kann, ohne Titel und
 * Gesamtseitenzahl erneut einzutippen. "Neues Buch" ist immer als Option dabei.
 *
 * deferReply() zuerst (statt showModal direkt), da wir vor der ersten Antwort
 * die Bibliothek abfragen müssen - ein Select-Menü kann (anders als ein Modal)
 * per editReply() nach einem deferReply() nachgereicht werden.
 */
async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [sprintId] = args;
    // Beitritt nur, solange der Sprint noch wirklich aktiv liest (nicht in der
    // Kulanzzeit oder bereits beendet) - siehe Bug-Report: sonst konnte man
    // während der Kulanzzeit noch "frisch" beitreten.
    const sprint = await Sprint_1.Sprint.findById(sprintId);
    if (!sprint || sprint.status !== "active") {
        await interaction.editReply({ content: texts_1.Texts.end.sprintOver });
        return;
    }
    // Wer diesen Sprint bereits verlassen hat, darf nicht erneut beitreten.
    // Wer schon aktiv/pausiert teilnimmt, bekommt stattdessen den Hinweis,
    // dass er bereits dabei ist.
    const existingParticipant = await SprintParticipant_1.SprintParticipant.findOne({ sprintId, userId: interaction.user.id });
    if (existingParticipant) {
        const message = existingParticipant.status === "left" ? texts_1.Texts.join.alreadyLeft : texts_1.Texts.join.alreadyJoined;
        await interaction.editReply({ content: message });
        return;
    }
    const unfinishedBooks = await (0, bookService_1.getUnfinishedBooks)(interaction.user.id, interaction.guildId);
    const select = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.SELECT_JOIN_BOOK, sprintId))
        .setPlaceholder(texts_1.Texts.bookSelect.placeholder)
        .addOptions(...unfinishedBooks.map((book) => ({
        label: book.title.slice(0, 100),
        value: book.id,
        description: texts_1.Texts.bookSelect
            .bookOptionDescription((0, bookProgress_1.formatLabel)(book.format), (0, bookProgress_1.describeBookTotal)(book.format, book.totalPages, book.totalMinutes))
            .slice(0, 100),
    })), {
        label: texts_1.Texts.bookSelect.newBookOptionLabel,
        value: constants_1.NEW_BOOK_SELECT_VALUE,
        description: texts_1.Texts.bookSelect.newBookOptionDescription,
    });
    const row = new discord_js_1.ActionRowBuilder().addComponents(select);
    await interaction.editReply({ content: texts_1.Texts.bookSelect.prompt, components: [row] });
}
