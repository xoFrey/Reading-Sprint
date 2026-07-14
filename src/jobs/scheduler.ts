import { Client, TextChannel } from "discord.js";
import { ScheduledSprint } from "../database/models/ScheduledSprint";
import { Sprint } from "../database/models/Sprint";
import { Texts } from "../config/texts";
import { GRACE_PERIOD_MINUTES } from "../config/constants";
import { startSprint, startGracePeriod, finalizeSprint } from "../services/sprintService";
import { buildJoinEmbed } from "../embeds/joinEmbed";
import { buildSprintEndEmbed } from "../embeds/sprintEndEmbed";
import { refreshPanel } from "../services/panelService";

const CHECK_INTERVAL_MS = 60_000; // jede Minute prüfen reicht für Erinnerungen auf Minutenbasis

/**
 * Startet den periodischen Scheduler. Läuft für die gesamte Lebenszeit des
 * Prozesses und übernimmt vier Aufgaben, die zeitbasiert und nicht durch
 * Nutzer-Interaktionen ausgelöst werden:
 *   1. 30-/5-Minuten-Erinnerungen vor geplanten Sprints senden
 *   2. geplante Sprints zur Startzeit automatisch starten
 *   3. aktive Sprints nach Ablauf ihrer Dauer in die Kulanzzeit versetzen
 *   4. Sprints nach Ablauf der Kulanzzeit final auswerten
 */
export function startScheduler(client: Client): void {
  setInterval(() => {
    checkReminders(client).catch((error) => console.error("[Scheduler] Reminder-Fehler:", error));
    checkScheduledStarts(client).catch((error) => console.error("[Scheduler] Start-Fehler:", error));
    checkActiveSprintEnds(client).catch((error) => console.error("[Scheduler] End-Fehler:", error));
    checkGracePeriodEnds(client).catch((error) => console.error("[Scheduler] Kulanzzeit-Fehler:", error));
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
      await channel.send(Texts.schedule.reminder30);
      scheduled.remindersSent.thirtyMin = true;
      await scheduled.save();
    }

    if (!scheduled.remindersSent.fiveMin && msUntilStart <= 5 * 60_000 && msUntilStart > 0) {
      await channel.send(Texts.schedule.reminder5);
      scheduled.remindersSent.fiveMin = true;
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

    await channel.send({ content: mentions || undefined, embeds: [embed], components });

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
      await channel.send(Texts.grace.started(GRACE_PERIOD_MINUTES, graceEndUnix));
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

    if (channel) {
      const embed = buildSprintEndEmbed(results);
      await channel.send({ embeds: [embed] });
    }
  }
}
