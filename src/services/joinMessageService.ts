import { Client, TextChannel } from "discord.js";
import { Sprint } from "../database/models/Sprint";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { buildJoinEmbed, JoinEmbedParticipant } from "../embeds/joinEmbed";
import { getCurrentBook } from "./sprintService";

/**
 * Baut das öffentliche Sprint-Embed neu und aktualisiert die gepostete
 * Nachricht per edit() - so sieht jeder live, wer mitmacht und welches
 * Buch gerade gelesen wird. Wird nach jedem Beitritt, Buchwechsel, Pause/
 * Weiter und Verlassen aufgerufen.
 *
 * Macht nichts, falls die Nachricht (noch) nicht bekannt ist oder der Sprint
 * bereits vorbei ist (kein Sinn mehr, die "Beitreten"-Nachricht zu updaten).
 */
export async function refreshJoinMessage(client: Client, sprintId: string): Promise<void> {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint || !sprint.messageId || sprint.status === "ended") return;

  const channel = await client.channels.fetch(sprint.channelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  const message = await (channel as TextChannel).messages.fetch(sprint.messageId).catch(() => null);
  if (!message) return;

  const activeParticipants = await SprintParticipant.find({
    sprintId,
    status: { $ne: "left" },
  });

  const participants: JoinEmbedParticipant[] = activeParticipants.map((participant) => {
    const currentBook = getCurrentBook(participant);
    return {
      userId: participant.userId,
      bookTitle: currentBook?.title ?? "—",
      startPage: currentBook?.startPage ?? 0,
      paused: participant.status === "paused",
    };
  });

  const endTime = new Date(sprint.startTime.getTime() + sprint.duration * 60_000);
  const { embed, components } = buildJoinEmbed(sprintId, sprint.duration, endTime, participants);

  await message.edit({ embeds: [embed], components }).catch(() => undefined);
}
