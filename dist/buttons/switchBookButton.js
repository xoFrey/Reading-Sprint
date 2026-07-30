"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const bookService_1 = require("../services/bookService");
const bookProgress_1 = require("../services/bookProgress");
const SprintParticipant_1 = require("../database/models/SprintParticipant");
const sprintService_1 = require("../services/sprintService");
/**
 * Gleicher Ansatz wie beim Sprint-Beitritt (siehe joinButton.ts): erst
 * Bibliotheks-Auswahl zeigen, dann je nach Auswahl das passende Modal.
 * Das aktuell gelesene Buch wird aus der Liste ausgeschlossen (Wechsel zum
 * selben Buch ergibt keinen Sinn).
 */
async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [participantId] = args;
    const participant = await SprintParticipant_1.SprintParticipant.findById(participantId);
    const currentBookTitle = participant ? (0, sprintService_1.getCurrentBook)(participant)?.title.toLowerCase() : undefined;
    const unfinishedBooks = (await (0, bookService_1.getUnfinishedBooks)(interaction.user.id, interaction.guildId)).filter((book) => book.title.toLowerCase() !== currentBookTitle);
    const select = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.SELECT_SWITCH_BOOK, participantId))
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
