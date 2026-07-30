"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const bookProgress_1 = require("../services/bookProgress");
const sprintService_1 = require("../services/sprintService");
const participantPanelEmbed_1 = require("../embeds/participantPanelEmbed");
const joinMessageService_1 = require("../services/joinMessageService");
const Sprint_1 = require("../database/models/Sprint");
const SprintParticipant_1 = require("../database/models/SprintParticipant");
async function execute(interaction) {
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [sprintId, formatRaw] = args;
    const format = formatRaw;
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
    // Erneute Prüfung (Race Condition): der Sprint könnte zwischen Button-Klick
    // und Absenden des Modals in die Kulanzzeit gewechselt sein.
    const sprint = await Sprint_1.Sprint.findById(sprintId);
    if (!sprint || sprint.status !== "active") {
        await interaction.reply({ content: texts_1.Texts.end.sprintOver, ephemeral: true });
        return;
    }
    const input = {
        title,
        format,
        current,
        total,
        goalDelta: goalDelta ?? undefined,
    };
    let participant;
    try {
        participant = await (0, sprintService_1.joinSprint)(sprintId, interaction.user.id, interaction.guildId, input);
    }
    catch (error) {
        // Doppelter Beitritt (z.B. durch Doppelklick oder abgelaufenes vorheriges
        // Interaction-Token) -> freundliche Meldung statt hartem Crash.
        if (error?.code === 11000) {
            const existing = await SprintParticipant_1.SprintParticipant.findOne({ sprintId, userId: interaction.user.id });
            const message = existing?.status === "left" ? texts_1.Texts.join.alreadyLeft : texts_1.Texts.join.alreadyJoined;
            await interaction.reply({ content: message, ephemeral: true });
            return;
        }
        throw error;
    }
    const { embed, components } = (0, participantPanelEmbed_1.buildParticipantPanel)(participant);
    await interaction.reply({
        content: texts_1.Texts.join.welcome(title),
        embeds: [embed],
        components,
        ephemeral: true,
    });
    await (0, joinMessageService_1.refreshJoinMessage)(interaction.client, sprintId);
}
