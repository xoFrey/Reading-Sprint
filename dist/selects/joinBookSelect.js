"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const Book_1 = require("../database/models/Book");
const bookProgress_1 = require("../services/bookProgress");
/**
 * Reagiert auf die Buchauswahl aus buttons/joinButton.ts.
 * - "Neues Buch" ausgewählt -> erst Format-Auswahl (siehe bookFormatSelect.ts),
 *   da Titel/Umfang je nach Format unterschiedliche Felder brauchen.
 * - vorhandenes Buch ausgewählt -> schlankes Modal (nur Fortschritt + optional
 *   Ziel, format-abhängig beschriftet), Titel/Umfang kommen aus der Bibliothek.
 *
 * Select-Menü-Interaktionen dürfen (wie Buttons) ein Modal ODER ein weiteres
 * Select-Menü als erste Antwort zeigen - deshalb kein deferReply hier.
 */
async function execute(interaction) {
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [sprintId] = args;
    const selectedValue = interaction.values[0];
    if (selectedValue === constants_1.NEW_BOOK_SELECT_VALUE) {
        const select = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.SELECT_NEW_BOOK_FORMAT, "join", sprintId))
            .setPlaceholder(texts_1.Texts.bookFormat.selectPlaceholder)
            .addOptions({ label: texts_1.Texts.bookFormat.physicalLabel, value: "physical", description: texts_1.Texts.bookFormat.physicalDescription }, { label: texts_1.Texts.bookFormat.ebookLabel, value: "ebook", description: texts_1.Texts.bookFormat.ebookDescription }, { label: texts_1.Texts.bookFormat.audiobookLabel, value: "audiobook", description: texts_1.Texts.bookFormat.audiobookDescription });
        const row = new discord_js_1.ActionRowBuilder().addComponents(select);
        await interaction.update({ content: texts_1.Texts.bookFormat.selectPrompt, components: [row] });
        return;
    }
    // selectedValue ist hier die Book._id aus der Bibliothek.
    const bookId = selectedValue;
    const book = await Book_1.Book.findById(bookId);
    if (!book) {
        await interaction.update({ content: texts_1.Texts.myBooks.notFound, components: [] });
        return;
    }
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.MODAL_JOIN_EXISTING_BOOK, sprintId, bookId))
        .setTitle(texts_1.Texts.bookSelect.modalTitleExisting);
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
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(currentInput), new discord_js_1.ActionRowBuilder().addComponents(goalInput));
    await interaction.showModal(modal);
}
