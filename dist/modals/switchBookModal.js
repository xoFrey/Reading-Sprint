"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const bookProgress_1 = require("../services/bookProgress");
const SprintParticipant_1 = require("../database/models/SprintParticipant");
const sprintService_1 = require("../services/sprintService");
const participantPanelEmbed_1 = require("../embeds/participantPanelEmbed");
const joinMessageService_1 = require("../services/joinMessageService");
async function execute(interaction) {
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [participantId, formatRaw] = args;
    const format = formatRaw;
    const participant = await SprintParticipant_1.SprintParticipant.findById(participantId);
    if (!participant) {
        await interaction.reply({ content: texts_1.Texts.errors.notInSprint, ephemeral: true });
        return;
    }
    const oldBook = (0, sprintService_1.getCurrentBook)(participant);
    const oldCurrent = oldBook
        ? (0, bookProgress_1.parseFormatValue)(oldBook.format, interaction.fields.getTextInputValue("oldCurrent"))
        : null;
    const title = interaction.fields.getTextInputValue("title").trim();
    const current = (0, bookProgress_1.parseFormatValue)(format, interaction.fields.getTextInputValue("current"));
    const total = (0, bookProgress_1.parseFormatValuePositive)(format, interaction.fields.getTextInputValue("total"));
    const goalRaw = interaction.fields.getTextInputValue("goal");
    const goalDelta = goalRaw ? (0, bookProgress_1.parseFormatValuePositive)(format, goalRaw) : null;
    if (current === null || total === null || (goalRaw && goalDelta === null)) {
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
    // Erst den Fortschritt im BISHERIGEN Buch speichern (gleiche Validierung
    // wie beim regulären "Fortschritt aktualisieren"), bevor überhaupt das
    // neue Buch angelegt wird.
    const oldTotal = oldBook
        ? oldBook.format === "audiobook"
            ? oldBook.totalMinutes
            : oldBook.totalPages
        : undefined;
    const oldStart = oldBook
        ? oldBook.format === "audiobook"
            ? oldBook.startMinutes
            : oldBook.format === "ebook"
                ? oldBook.startPercent
                : oldBook.startPage
        : undefined;
    if (oldCurrent === null ||
        !oldBook ||
        oldStart === undefined ||
        oldTotal === undefined ||
        oldCurrent < oldStart ||
        oldCurrent > oldTotal) {
        await interaction.reply({ content: texts_1.Texts.participant.updatePageInvalid, ephemeral: true });
        return;
    }
    await (0, sprintService_1.updateBookProgress)(participant, oldCurrent);
    const input = {
        title,
        format,
        current,
        total,
        goalDelta: goalDelta ?? undefined,
    };
    const updatedParticipant = await (0, sprintService_1.switchBook)(participantId, interaction.user.id, interaction.guildId, input);
    if (!updatedParticipant) {
        await interaction.reply({ content: texts_1.Texts.errors.notInSprint, ephemeral: true });
        return;
    }
    const { embed, components } = (0, participantPanelEmbed_1.buildParticipantPanel)(updatedParticipant);
    await interaction.reply({
        content: texts_1.Texts.participant.switchBookSuccess(title),
        embeds: [embed],
        components,
        ephemeral: true,
    });
    await (0, joinMessageService_1.refreshJoinMessage)(interaction.client, updatedParticipant.sprintId.toString());
}
