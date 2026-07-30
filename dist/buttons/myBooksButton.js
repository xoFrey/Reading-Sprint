"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const Book_1 = require("../database/models/Book");
const bookProgress_1 = require("../services/bookProgress");
const MAX_BOOKS_SHOWN = 25; // Discord-Limit für Select-Menü-Optionen
async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const books = await Book_1.Book.find({ userId: interaction.user.id, guildId: interaction.guildId }).sort({
        updatedAt: -1,
    });
    if (books.length === 0) {
        await interaction.editReply({ content: texts_1.Texts.myBooks.noBooks });
        return;
    }
    const select = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.SELECT_MANAGE_BOOK))
        .setPlaceholder(texts_1.Texts.myBooks.placeholder)
        .addOptions(books.slice(0, MAX_BOOKS_SHOWN).map((book) => ({
        label: book.title.slice(0, 100),
        value: book.id,
        description: `${(0, bookProgress_1.formatLabel)(book.format)} · ${(0, bookProgress_1.describeBookTotal)(book.format, book.totalPages, book.totalMinutes)}${book.isFinished ? " · Beendet" : ""}`.slice(0, 100),
    })));
    const row = new discord_js_1.ActionRowBuilder().addComponents(select);
    await interaction.editReply({ content: texts_1.Texts.myBooks.prompt, components: [row] });
}
