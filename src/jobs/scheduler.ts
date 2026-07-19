import { Client, TextChannel, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { ScheduledSprint } from "../database/models/ScheduledSprint";
import { Sprint } from "../database/models/Sprint";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { Texts } from "../config/texts";
import { GRACE_PERIOD_MINUTES, MESSAGE_CLEANUP_DELAY_MINUTES, CustomId, buildCustomId } from "../config/constants";
import { startSprint, startGracePeriod, finalizeSprint } from "../services/sprintService";
import { buildJoinEmbed } from "../embeds/joinEmbed";
import { buildSprintEndImage } from "../services/sprintEndImageService";
import { refreshPanel } from "../services/panelService";

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
export function startScheduler(client: Client): void {
  setInterval(() => {
    checkReminders(client).catch((error) => console.error("[Scheduler] Reminder-Fehler:", error));
    checkScheduledStarts(client).catch((error) => console.error("[Scheduler] Start-Fehler:", error));
    checkActiveSprintEnds(client).catch((error) => console.error("[Scheduler] End-Fehler:", error));
    checkGracePeriodEnds(client).catch((error) => console.error("[Scheduler] Kulanzzeit-Fehler:", error));
    checkMessageCleanup(client).catch((error) => console.error("[Scheduler] Cleanup-Fehler:", error));
  }, CHECK_INTERVAL_MS);

  console.log("[Scheduler] Gestartet (Intervall: 60s).");
}

async function fetchTextChannel(client: Client, channelId: string): Promise<TextChannel | null> {
  const channel = await client.channels.fetch(channelId).catch(() => null);
  return channel?.isTextBased() ? (channel as TextChannel) : null;
}

async function checkReminders(client: Client): Promise<void> {
  const now = Date.now();
  const upcoming = await ScheduledSprint.find({ status: "scheduled" });

  for (const scheduled of upcoming) {
    const msUntilStart = scheduled.scheduledStart.getTime() - now;
    const channel = await fetchTextChannel(client, scheduled.channelId);
    if (!channel) continue;

    if (!scheduled.remindersSent.thirtyMin && msUntilStart <= 30 * 60_000 && msUntilStart > 5 * 60_000) {
      const sentMessage = await channel.send(Texts.schedule.reminder30);
      scheduled.remindersSent.thirtyMin = true;
      scheduled.reminderMessageIds.push(sentMessage.id);
      await scheduled.save();
    }

    if (!scheduled.remindersSent.fiveMin && msUntilStart <= 5 * 60_000 && msUntilStart > 0) {
      const sentMessage = await channel.send(Texts.schedule.reminder5);
      scheduled.remindersSent.fiveMin = true;
      scheduled.reminderMessageIds.push(sentMessage.id);
      await scheduled.save();
    }
  }
}

async function checkScheduledStarts(client: Client): Promise<void> {
  const due = await ScheduledSprint.find({
    status: "scheduled",
    scheduledStart: { $lte: new Date() },
  });

  for (const scheduled of due) {
    const channel = await fetchTextChannel(client, scheduled.channelId);
    if (!channel) continue;

    const sprint = await startSprint(
      scheduled.guildId,
      scheduled.channelId,
      scheduled.createdBy,
      scheduled.duration
    );

    const endTime = new Date(sprint.startTime.getTime() + scheduled.duration * 60_000);
    const { embed, components } = buildJoinEmbed(sprint.id, scheduled.duration, endTime);

    // Wer sich vorab angemeldet hat, wird direkt gepingt, damit die
    // Anmeldung tatsächlich als Erinnerung dient.
    const mentions = scheduled.registeredUsers.map((userId) => `<@${userId}>`).join(" ");

    const sentMessage = await channel.send({ content: mentions || undefined, embeds: [embed], components });

    sprint.messageId = sentMessage.id;
    // Erinnerungs-Message-IDs von der ScheduledSprint übernehmen, damit der
    // Cleanup-Job (checkMessageCleanup) sie später mit aufräumen kann.
    sprint.reminderMessageIds = scheduled.reminderMessageIds;
    await sprint.save();

    scheduled.status = "triggered";
    await scheduled.save();

    await refreshPanel(client, scheduled.guildId);
  }
}

async function checkActiveSprintEnds(client: Client): Promise<void> {
  const activeSprints = await Sprint.find({ status: "active" });

  for (const sprint of activeSprints) {
    const endTime = sprint.startTime.getTime() + sprint.duration * 60_000;
    if (endTime > Date.now()) continue;

    const channel = await fetchTextChannel(client, sprint.channelId);
    const updatedSprint = await startGracePeriod(sprint.id);

    if (channel && updatedSprint.graceEndTime) {
      const graceEndUnix = Math.floor(updatedSprint.graceEndTime.getTime() / 1000).toString();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(buildCustomId(CustomId.SPRINT_GRACE_UPDATE_PAGE, sprint.id))
          .setLabel(Texts.grace.updateButtonLabel)
          .setEmoji("✏️")
          .setStyle(ButtonStyle.Primary)
      );

      // Nur die tatsächlichen Teilnehmer pingen (nicht @here/@everyone),
      // damit sie ihre letzte Seite noch eintragen können.
      const activeParticipants = await SprintParticipant.find({
        sprintId: sprint.id,
        status: { $ne: "left" },
      });
      const mentions = activeParticipants.map((p) => `<@${p.userId}>`).join(" ");

      const sentMessage = await channel.send({
        content: `${mentions}\n${Texts.grace.started(GRACE_PERIOD_MINUTES, graceEndUnix)}`,
        components: [row],
      });

      updatedSprint.graceMessageId = sentMessage.id;
      await updatedSprint.save();
    }
  }
}

async function checkGracePeriodEnds(client: Client): Promise<void> {
  const sprintsInGrace = await Sprint.find({
    status: "grace",
    graceEndTime: { $lte: new Date() },
  });

  for (const sprint of sprintsInGrace) {
    const channel = await fetchTextChannel(client, sprint.channelId);
    const results = await finalizeSprint(sprint.id);

    if (!channel) continue;

    if (results.length === 0) {
      await channel.send(Texts.sprintEnd.noParticipants);
      continue;
    }

    const imageBuffer = await buildSprintEndImage(client, sprint.guildId, results, sprint.duration);
    const attachment = new AttachmentBuilder(imageBuffer, { name: "sprint-ende.png" });
    const sentMessage = await channel.send({ files: [attachment] });

    // sprint wurde in finalizeSprint() bereits gespeichert (status: "ended");
    // hier nur die zusätzliche ID nachtragen, kein erneutes vollständiges Save nötig.
    sprint.endMessageId = sentMessage.id;
    await sprint.save();
  }
}

/**
 * Löscht ALLE Kanal-Nachrichten eines Sprints (Beitreten-Embed, Erinnerungen,
 * Kulanzzeit-Ankündigung, Abschluss-Bild), sobald er seit mindestens
 * MESSAGE_CLEANUP_DELAY_MINUTES beendet ist. So bleibt der Kanal übersichtlich
 * und zeigt nur noch aktive/geplante Sprints.
 */
async function checkMessageCleanup(client: Client): Promise<void> {
  const cutoff = new Date(Date.now() - MESSAGE_CLEANUP_DELAY_MINUTES * 60_000);

  const sprintsToClean = await Sprint.find({
    status: "ended",
    endTime: { $lte: cutoff },
    messagesCleanedUp: false,
  });

  for (const sprint of sprintsToClean) {
    const channel = await fetchTextChannel(client, sprint.channelId);

    if (channel) {
      // Jeder Löschversuch unabhängig von den anderen - falls eine Nachricht
      // bereits manuell gelöscht wurde, soll das die übrigen nicht verhindern.
      const messageIds = [
        sprint.messageId,
        sprint.graceMessageId,
        sprint.endMessageId,
        ...sprint.reminderMessageIds,
      ];

      for (const messageId of messageIds) {
        if (!messageId) continue;
        await channel.messages.delete(messageId).catch(() => undefined);
      }
    }

    sprint.messagesCleanedUp = true;
    await sprint.save();
  }
}
