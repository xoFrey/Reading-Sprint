"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const Book_1 = require("../database/models/Book");
const SprintParticipant_1 = require("../database/models/SprintParticipant");
const sprintService_1 = require("../services/sprintService");
const bookProgress_1 = require("../services/bookProgress");
/**
 * Reagiert auf die Buchauswahl aus buttons/switchBookButton.ts.
 * - "Neues Buch" -> erst Format-Auswahl (siehe bookFormatSelect.ts).
 * - vorhandenes Buch -> Modal mit "alte Seite" (Format des BISHERIGEN Buchs)
 *   + Fortschritt/Ziel (Format des NEUEN, gewählten Buchs) - Titel/Umfang
 *   kommen aus der Bibliothek.
 */
async function execute(interaction) {
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [participantId] = args;
    const selectedValue = interaction.values[0];
    if (selectedValue === constants_1.NEW_BOOK_SELECT_VALUE) {
        const select = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.SELECT_NEW_BOOK_FORMAT, "switch", participantId))
            .setPlaceholder(texts_1.Texts.bookFormat.selectPlaceholder)
            .addOptions({ label: texts_1.Texts.bookFormat.physicalLabel, value: "physical", description: texts_1.Texts.bookFormat.physicalDescription }, { label: texts_1.Texts.bookFormat.ebookLabel, value: "ebook", description: texts_1.Texts.bookFormat.ebookDescription }, { label: texts_1.Texts.bookFormat.audiobookLabel, value: "audiobook", description: texts_1.Texts.bookFormat.audiobookDescription });
        const row = new discord_js_1.ActionRowBuilder().addComponents(select);
        await interaction.update({ content: texts_1.Texts.bookFormat.selectPrompt, components: [row] });
        return;
    }
    // selectedValue ist hier die Book._id aus der Bibliothek.
    const bookId = selectedValue;
    const book = await Book_1.Book.findById(bookId);
    const participant = await SprintParticipant_1.SprintParticipant.findById(participantId);
    const oldBook = participant ? (0, sprintService_1.getCurrentBook)(participant) : undefined;
    if (!book || !oldBook) {
        await interaction.update({ content: texts_1.Texts.myBooks.notFound, components: [] });
        return;
    }
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.MODAL_SWITCH_TO_EXISTING_BOOK, participantId, bookId))
        .setTitle(texts_1.Texts.bookSelect.modalTitleExisting);
    const oldCurrentInput = new discord_js_1.TextInputBuilder()
        .setCustomId("oldCurrent")
        .setLabel((0, bookProgress_1.getOldCurrentFieldLabel)(oldBook.format))
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    const currentInput = new discord_js_1.TextInputBuilder()
        .setCustomId("current")
        .setLabel((0, bookProgress_1.getCurrentFieldLabel)(book.format))
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    const goalInput = new discord_js_1.TextInputBuilder()
        .setCustomId("goal")
        .setLabel((0, bookProgress_1.getGoalFieldLabel)(book.format))
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(false);
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(oldCurrentInput), new discord_js_1.ActionRowBuilder().addComponents(currentInput), new discord_js_1.ActionRowBuilder().addComponents(goalInput));
    await interaction.showModal(modal);
}
