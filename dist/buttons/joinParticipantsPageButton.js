"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const Sprint_1 = require("../database/models/Sprint");
const SprintParticipant_1 = require("../database/models/SprintParticipant");
const joinEmbed_1 = require("../embeds/joinEmbed");
const joinMessageService_1 = require("../services/joinMessageService");
/**
 * Blättert für ALLE Betrachter gleichzeitig (die Nachricht wird direkt
 * editiert, nicht ephemeral) - die zuletzt gewählte Seite wird am Sprint
 * gespeichert (Sprint.participantsPage), damit sie bei automatischen
 * Updates (Beitritt, Pause, ...) erhalten bleibt.
 */
async function execute(interaction) {
    await interaction.deferUpdate();
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [sprintId, pageStr] = args;
    const requestedPage = Number.parseInt(pageStr, 10);
    const sprint = await Sprint_1.Sprint.findById(sprintId);
    if (!sprint) {
        await interaction.followUp({ content: texts_1.Texts.errors.generic, ephemeral: true });
        return;
    }
    const activeParticipants = await SprintParticipant_1.SprintParticipant.find({
        sprintId,
        status: { $ne: "left" },
    });
    const participants = (0, joinMessageService_1.buildJoinEmbedParticipants)(activeParticipants);
    sprint.participantsPage = requestedPage;
    await sprint.save();
    const endTime = new Date(sprint.startTime.getTime() + sprint.duration * 60_000);
    const { embed, components } = (0, joinEmbed_1.buildJoinEmbed)(sprintId, sprint.duration, endTime, participants, requestedPage);
    await interaction.editReply({ embeds: [embed], components });
}
