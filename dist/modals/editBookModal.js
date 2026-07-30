"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
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
    const title = interaction.fields.getTextInputValue("title").trim();
    const total = (0, bookProgress_1.parseFormatValuePositive)(book.format, interaction.fields.getTextInputValue("total"));
    if (!title || total === null) {
        await interaction.reply({ content: texts_1.Texts.join.invalidValue, ephemeral: true });
        return;
    }
    book.title = title;
    if (book.format === "audiobook") {
        book.totalMinutes = total;
    }
    else {
        book.totalPages = total;
    }
    await book.save();
    await interaction.reply({ content: texts_1.Texts.myBooks.editSuccess, ephemeral: true });
}
