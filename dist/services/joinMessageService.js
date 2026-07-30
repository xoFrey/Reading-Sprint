"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildJoinEmbedParticipants = buildJoinEmbedParticipants;
exports.refreshJoinMessage = refreshJoinMessage;
const Sprint_1 = require("../database/models/Sprint");
const SprintParticipant_1 = require("../database/models/SprintParticipant");
const joinEmbed_1 = require("../embeds/joinEmbed");
const sprintService_1 = require("./sprintService");
const bookProgress_1 = require("./bookProgress");
/**
 * Baut die Teilnehmerliste fürs öffentliche Sprint-Embed - format-abhängig
 * beschriftet (Seite/Prozent/Std:Min). Zentral hier, damit refreshJoinMessage
 * und das manuelle Blättern (joinParticipantsPageButton.ts) dieselbe Logik nutzen.
 */
function buildJoinEmbedParticipants(participants) {
    return participants.map((participant) => {
        const currentBook = (0, sprintService_1.getCurrentBook)(participant);
        let progressLabel = "gerade begonnen";
        if (currentBook) {
            switch (currentBook.format) {
                case "physical":
                    progressLabel = `ab Seite ${currentBook.startPage}`;
                    break;
                case "ebook":
                    progressLabel = `ab ${currentBook.startPercent}%`;
                    break;
                case "audiobook":
                    progressLabel = `ab ${(0, bookProgress_1.formatHM)(currentBook.startMinutes ?? 0)} Std`;
                    break;
            }
        }
        return {
            userId: participant.userId,
            bookTitle: currentBook?.title ?? "—",
            progressLabel,
            paused: participant.status === "paused",
        };
    });
}
/**
 * Baut das öffentliche Sprint-Embed neu und aktualisiert die gepostete
 * Nachricht per edit() - so sieht jeder live, wer mitmacht und welches
 * Buch gerade gelesen wird. Wird nach jedem Beitritt, Buchwechsel, Pause/
 * Weiter und Verlassen aufgerufen.
 *
 * Macht nichts, falls die Nachricht (noch) nicht bekannt ist oder der Sprint
 * bereits vorbei ist (kein Sinn mehr, die "Beitreten"-Nachricht zu updaten).
 */
async function refreshJoinMessage(client, sprintId) {
    const sprint = await Sprint_1.Sprint.findById(sprintId);
    if (!sprint || !sprint.messageId || sprint.status === "ended")
        return;
    const channel = await client.channels.fetch(sprint.channelId).catch(() => null);
    if (!channel?.isTextBased())
        return;
    const message = await channel.messages.fetch(sprint.messageId).catch(() => null);
    if (!message)
        return;
    const activeParticipants = await SprintParticipant_1.SprintParticipant.find({
        sprintId,
        status: { $ne: "left" },
    });
    const participants = buildJoinEmbedParticipants(activeParticipants);
    const endTime = new Date(sprint.startTime.getTime() + sprint.duration * 60_000);
    const { embed, components } = (0, joinEmbed_1.buildJoinEmbed)(sprintId, sprint.duration, endTime, participants, sprint.participantsPage);
    await message.edit({ embeds: [embed], components }).catch(() => undefined);
}
