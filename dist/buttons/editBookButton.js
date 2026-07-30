"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const Book_1 = require("../database/models/Book");
const bookProgress_1 = require("../services/bookProgress");
async function execute(interaction) {
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [bookId] = args;
    const book = await Book_1.Book.findById(bookId);
    if (!book) {
        await interaction.reply({ content: texts_1.Texts.myBooks.notFound, ephemeral: true });
        return;
    }
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.MODAL_EDIT_BOOK, bookId))
        .setTitle(texts_1.Texts.myBooks.editModalTitle);
    const titleInput = new discord_js_1.TextInputBuilder()
        .setCustomId("title")
        .setLabel(texts_1.Texts.join.bookTitleLabel)
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setValue(book.title)
        .setRequired(true);
    const totalValue = book.format === "audiobook" ? (0, bookProgress_1.formatHM)(book.totalMinutes ?? 0) : String(book.totalPages ?? 0);
    const totalInput = new discord_js_1.TextInputBuilder()
        .setCustomId("total")
        .setLabel((0, bookProgress_1.getTotalFieldLabel)(book.format))
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setValue(totalValue)
        .setRequired(true);
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(titleInput), new discord_js_1.ActionRowBuilder().addComponents(totalInput));
    await interaction.showModal(modal);
}
