"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const SprintParticipant_1 = require("../database/models/SprintParticipant");
const participantPanelEmbed_1 = require("../embeds/participantPanelEmbed");
/**
 * Sitzt neben "Beitreten" auf der öffentlichen Sprint-Start-Nachricht.
 * Findet den eigenen Teilnehmer-Datensatz und zeigt das private Panel erneut
 * an - praktisch, falls jemand die ursprüngliche ephemeral Nachricht
 * versehentlich weggeklickt ("dismissed") hat und sonst nichts mehr tun könnte.
 */
async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [sprintId] = args;
    const participant = await SprintParticipant_1.SprintParticipant.findOne({
        sprintId,
        userId: interaction.user.id,
        status: { $ne: "left" },
    });
    if (!participant) {
        await interaction.editReply({ content: texts_1.Texts.join.notYetJoined });
        return;
    }
    const { embed, components } = (0, participantPanelEmbed_1.buildParticipantPanel)(participant);
    await interaction.editReply({ embeds: [embed], components });
}
