"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const Book_1 = require("../database/models/Book");
async function execute(interaction) {
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [bookId] = args;
    const book = await Book_1.Book.findByIdAndDelete(bookId);
    if (!book) {
        await interaction.update({ content: texts_1.Texts.myBooks.notFound, components: [] });
        return;
    }
    await interaction.update({ content: texts_1.Texts.myBooks.deleteSuccess(book.title), components: [] });
}
