"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePause = executePause;
exports.executeResume = executeResume;
exports.executeLeave = executeLeave;
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const SprintParticipant_1 = require("../database/models/SprintParticipant");
const sprintService_1 = require("../services/sprintService");
const participantPanelEmbed_1 = require("../embeds/participantPanelEmbed");
const joinMessageService_1 = require("../services/joinMessageService");
/**
 * Gemeinsame Logik für Pause/Weiter/Verlassen, da sich alle drei nur durch
 * den Ziel-Status unterscheiden. Reduziert Duplizierung gegenüber drei
 * fast identischen Dateien.
 */
async function handleStatusChange(interaction, status) {
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [participantId] = args;
    await (0, sprintService_1.setParticipantStatus)(participantId, status);
    // sprintId wird für refreshJoinMessage gebraucht - der Datensatz existiert
    // auch nach "left" noch (nur der Status ändert sich), daher hier einmalig laden.
    const participant = await SprintParticipant_1.SprintParticipant.findById(participantId);
    if (status === "left") {
        await interaction.update({ content: texts_1.Texts.participant.left, embeds: [], components: [] });
        if (participant)
            await (0, joinMessageService_1.refreshJoinMessage)(interaction.client, participant.sprintId.toString());
        return;
    }
    if (!participant) {
        await interaction.reply({ content: texts_1.Texts.errors.notInSprint, ephemeral: true });
        return;
    }
    const { embed, components } = (0, participantPanelEmbed_1.buildParticipantPanel)(participant);
    const statusText = status === "paused" ? texts_1.Texts.participant.paused : texts_1.Texts.participant.resumed;
    await interaction.update({ content: statusText, embeds: [embed], components });
    await (0, joinMessageService_1.refreshJoinMessage)(interaction.client, participant.sprintId.toString());
}
async function executePause(interaction) {
    await handleStatusChange(interaction, "paused");
}
async function executeResume(interaction) {
    await handleStatusChange(interaction, "active");
}
async function executeLeave(interaction) {
    await handleStatusChange(interaction, "left");
}
