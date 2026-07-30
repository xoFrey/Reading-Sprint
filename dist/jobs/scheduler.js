"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduler = startScheduler;
const discord_js_1 = require("discord.js");
const ScheduledSprint_1 = require("../database/models/ScheduledSprint");
const Sprint_1 = require("../database/models/Sprint");
const SprintParticipant_1 = require("../database/models/SprintParticipant");
const texts_1 = require("../config/texts");
const constants_1 = require("../config/constants");
const sprintService_1 = require("../services/sprintService");
const joinEmbed_1 = require("../embeds/joinEmbed");
const sprintEndImageService_1 = require("../services/sprintEndImageService");
const panelService_1 = require("../services/panelService");
const guildConfig_1 = require("../utils/guildConfig");
const CHECK_INTERVAL_MS = 60_000; // jede Minute prüfen reicht für Erinnerungen auf Minutenbasis
/**
 * Startet den periodischen Scheduler. Läuft für die gesamte Lebenszeit des
 * Prozesses und übernimmt fünf Aufgaben, die zeitbasiert und nicht durch
 * Nutzer-Interaktionen ausgelöst werden:
 *   1. 30-/5-Minuten-Erinnerungen vor geplanten Sprints senden
 *   2. geplante Sprints zur Startzeit automatisch starten
 *   3. aktive Sprints nach Ablauf ihrer Dauer in die Kulanzzeit versetzen
 *   4. Sprints nach Ablauf der Kulanzzeit final auswerten
 *   5. Nachrichten beendeter Sprints nach einer Wartezeit aufräumen
 */
function startScheduler(client) {
    setInterval(() => {
        checkReminders(client).catch((error) => console.error("[Scheduler] Reminder-Fehler:", error));
        checkScheduledStarts(client).catch((error) => console.error("[Scheduler] Start-Fehler:", error));
        checkActiveSprintEnds(client).catch((error) => console.error("[Scheduler] End-Fehler:", error));
        checkGracePeriodEnds(client).catch((error) => console.error("[Scheduler] Kulanzzeit-Fehler:", error));
        checkMessageCleanup(client).catch((error) => console.error("[Scheduler] Cleanup-Fehler:", error));
    }, CHECK_INTERVAL_MS);
    console.log("[Scheduler] Gestartet (Intervall: 60s).");
}
async function fetchTextChannel(client, channelId) {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    return channel?.isTextBased() ? channel : null;
}
async function checkReminders(client) {
    const now = Date.now();
    const upcoming = await ScheduledSprint_1.ScheduledSprint.find({ status: "scheduled" });
    for (const scheduled of upcoming) {
        const msUntilStart = scheduled.scheduledStart.getTime() - now;
        const channel = await fetchTextChannel(client, scheduled.channelId);
        if (!channel)
            continue;
        if (!scheduled.remindersSent.thirtyMin && msUntilStart <= 30 * 60_000 && msUntilStart > 5 * 60_000) {
            const sentMessage = await channel.send(texts_1.Texts.schedule.reminder30);
            scheduled.remindersSent.thirtyMin = true;
            scheduled.reminderMessageIds.push(sentMessage.id);
            await scheduled.save();
        }
        if (!scheduled.remindersSent.fiveMin && msUntilStart <= 5 * 60_000 && msUntilStart > 0) {
            const sentMessage = await channel.send(texts_1.Texts.schedule.reminder5);
            scheduled.remindersSent.fiveMin = true;
            scheduled.reminderMessageIds.push(sentMessage.id);
            await scheduled.save();
        }
    }
}
async function checkScheduledStarts(client) {
    const due = await ScheduledSprint_1.ScheduledSprint.find({
        status: "scheduled",
        scheduledStart: { $lte: new Date() },
    });
    for (const scheduled of due) {
        const channel = await fetchTextChannel(client, scheduled.channelId);
        if (!channel)
            continue;
        const sprint = await (0, sprintService_1.startSprint)(scheduled.guildId, scheduled.channelId, scheduled.createdBy, scheduled.duration);
        const endTime = new Date(sprint.startTime.getTime() + scheduled.duration * 60_000);
        const { embed, components } = (0, joinEmbed_1.buildJoinEmbed)(sprint.id, scheduled.duration, endTime);
        // Wer sich vorab angemeldet hat, wird direkt gepingt, damit die
        // Anmeldung tatsächlich als Erinnerung dient. Zusätzlich die
        // "Lesesprinter"-Rolle, falls konfiguriert.
        const userMentions = scheduled.registeredUsers.map((userId) => `<@${userId}>`).join(" ");
        const roleMention = (0, guildConfig_1.getRoleMention)();
        const content = [roleMention, userMentions].filter(Boolean).join(" ") || undefined;
        const sentMessage = await channel.send({ content, embeds: [embed], components });
        sprint.messageId = sentMessage.id;
        // Erinnerungs-Message-IDs von der ScheduledSprint übernehmen, damit der
        // Cleanup-Job (checkMessageCleanup) sie später mit aufräumen kann.
        sprint.reminderMessageIds = scheduled.reminderMessageIds;
        await sprint.save();
        scheduled.status = "triggered";
        await scheduled.save();
        await (0, panelService_1.refreshPanel)(client, scheduled.guildId);
    }
}
async function checkActiveSprintEnds(client) {
    const activeSprints = await Sprint_1.Sprint.find({ status: "active" });
    for (const sprint of activeSprints) {
        const endTime = sprint.startTime.getTime() + sprint.duration * 60_000;
        if (endTime > Date.now())
            continue;
        const channel = await fetchTextChannel(client, sprint.channelId);
        const updatedSprint = await (0, sprintService_1.startGracePeriod)(sprint.id);
        if (channel && updatedSprint.graceEndTime) {
            const graceEndUnix = Math.floor(updatedSprint.graceEndTime.getTime() / 1000).toString();
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.SPRINT_GRACE_UPDATE_PAGE, sprint.id))
                .setLabel(texts_1.Texts.grace.updateButtonLabel)
                .setEmoji("✏️")
                .setStyle(discord_js_1.ButtonStyle.Primary));
            // Nur die tatsächlichen Teilnehmer pingen (nicht @here/@everyone),
            // damit sie ihre letzte Seite noch eintragen können.
            const activeParticipants = await SprintParticipant_1.SprintParticipant.find({
                sprintId: sprint.id,
                status: { $ne: "left" },
            });
            const mentions = activeParticipants.map((p) => `<@${p.userId}>`).join(" ");
            const sentMessage = await channel.send({
                content: `${mentions}\n${texts_1.Texts.grace.started(constants_1.GRACE_PERIOD_MINUTES, graceEndUnix)}`,
                components: [row],
            });
            updatedSprint.graceMessageId = sentMessage.id;
            await updatedSprint.save();
        }
    }
}
async function checkGracePeriodEnds(client) {
    const sprintsInGrace = await Sprint_1.Sprint.find({
        status: "grace",
        graceEndTime: { $lte: new Date() },
    });
    for (const sprint of sprintsInGrace) {
        const sprintChannel = await fetchTextChannel(client, sprint.channelId);
        const results = await (0, sprintService_1.finalizeSprint)(sprint.id);
        if (results.length === 0) {
            if (sprintChannel)
                await sprintChannel.send(texts_1.Texts.sprintEnd.noParticipants);
            continue;
        }
        const totalPages = (0, sprintEndImageService_1.getTotalResultPages)(results.length);
        const imageBuffer = await (0, sprintEndImageService_1.buildSprintEndImage)(client, sprint.guildId, results, sprint.duration, 1);
        const attachment = new discord_js_1.AttachmentBuilder(imageBuffer, { name: "sprint-ende.png" });
        const row = (0, sprintEndImageService_1.buildResultsPaginationRow)(sprint.id, 1, totalPages);
        // Optional in einen separaten Ergebnis-Kanal posten (RESULTS_CHANNEL_ID),
        // sonst im selben Kanal wie der Sprint. Die Ergebnisse werden NICHT vom
        // Cleanup-Job gelöscht (siehe database/models/Sprint.ts).
        const resultsChannelId = (0, guildConfig_1.getResultsChannelId)();
        const resultsChannel = resultsChannelId
            ? await fetchTextChannel(client, resultsChannelId)
            : sprintChannel;
        if (!resultsChannel)
            continue;
        const sentMessage = await resultsChannel.send({
            files: [attachment],
            components: row ? [row] : [],
        });
        if (resultsChannel.id !== sprint.channelId && sprintChannel) {
            await sprintChannel.send(`📊 Ergebnisse: ${resultsChannel}`).catch(() => undefined);
        }
        // sprint wurde in finalizeSprint() bereits gespeichert (status: "ended");
        // hier nur die zusätzlichen Felder nachtragen.
        sprint.resultsMessageId = sentMessage.id;
        sprint.resultsChannelId = resultsChannel.id;
        sprint.resultsSnapshot = results;
        await sprint.save();
    }
}
/**
 * Löscht die Kanal-Nachrichten eines Sprints (Beitreten-Embed, Erinnerungen,
 * Kulanzzeit-Ankündigung), sobald er seit mindestens
 * MESSAGE_CLEANUP_DELAY_MINUTES beendet ist. Das Ergebnis-Bild (resultsMessageId)
 * wird BEWUSST NICHT gelöscht - das Abschluss-Leaderboard soll dauerhaft
 * stehen bleiben.
 */
async function checkMessageCleanup(client) {
    const cutoff = new Date(Date.now() - constants_1.MESSAGE_CLEANUP_DELAY_MINUTES * 60_000);
    const sprintsToClean = await Sprint_1.Sprint.find({
        status: "ended",
        endTime: { $lte: cutoff },
        messagesCleanedUp: false,
    });
    for (const sprint of sprintsToClean) {
        const channel = await fetchTextChannel(client, sprint.channelId);
        if (channel) {
            // Jeder Löschversuch unabhängig von den anderen - falls eine Nachricht
            // bereits manuell gelöscht wurde, soll das die übrigen nicht verhindern.
            const messageIds = [sprint.messageId, sprint.graceMessageId, ...sprint.reminderMessageIds];
            for (const messageId of messageIds) {
                if (!messageId)
                    continue;
                await channel.messages.delete(messageId).catch(() => undefined);
            }
        }
        sprint.messagesCleanedUp = true;
        await sprint.save();
    }
}
