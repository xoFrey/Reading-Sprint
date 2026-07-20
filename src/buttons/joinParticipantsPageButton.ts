import { ButtonInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { Sprint } from "../database/models/Sprint";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { buildJoinEmbed, JoinEmbedParticipant } from "../embeds/joinEmbed";
import { getCurrentBook } from "../services/sprintService";

/**
 * Blättert für ALLE Betrachter gleichzeitig (die Nachricht wird direkt
 * editiert, nicht ephemeral) - die zuletzt gewählte Seite wird am Sprint
 * gespeichert (Sprint.participantsPage), damit sie bei automatischen
 * Updates (Beitritt, Pause, ...) erhalten bleibt.
 */
export async function execute(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferUpdate();

  const { args } = parseCustomId(interaction.customId);
  const [sprintId, pageStr] = args;
  const requestedPage = Number.parseInt(pageStr, 10);

  const sprint = await Sprint.findById(sprintId);
  if (!sprint) {
    await interaction.followUp({ content: Texts.errors.generic, ephemeral: true });
    return;
  }

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

  sprint.participantsPage = requestedPage;
  await sprint.save();

  const endTime = new Date(sprint.startTime.getTime() + sprint.duration * 60_000);
  const { embed, components } = buildJoinEmbed(
    sprintId,
    sprint.duration,
    endTime,
    participants,
    requestedPage
  );

  await interaction.editReply({ embeds: [embed], components });
}
