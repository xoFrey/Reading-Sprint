"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const Book_1 = require("../database/models/Book");
async function execute(interaction) {
    const bookId = interaction.values[0];
    const book = await Book_1.Book.findById(bookId);
    if (!book) {
        await interaction.update({ content: texts_1.Texts.myBooks.notFound, components: [] });
        return;
    }
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.BOOK_EDIT, book.id))
        .setLabel(texts_1.Texts.myBooks.editButtonLabel)
        .setEmoji("✏️")
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.BOOK_DELETE, book.id))
        .setLabel(texts_1.Texts.myBooks.deleteButtonLabel)
        .setEmoji("🗑️")
        .setStyle(discord_js_1.ButtonStyle.Danger));
    await interaction.update({ content: texts_1.Texts.myBooks.managePrompt(book.title), components: [row] });
}
