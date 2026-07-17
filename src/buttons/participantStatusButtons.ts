import { ButtonInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { setParticipantStatus } from "../services/sprintService";
import { buildParticipantPanel } from "../embeds/participantPanelEmbed";
import { refreshJoinMessage } from "../services/joinMessageService";

/**
 * Gemeinsame Logik für Pause/Weiter/Verlassen, da sich alle drei nur durch
 * den Ziel-Status unterscheiden. Reduziert Duplizierung gegenüber drei
 * fast identischen Dateien.
 */
async function handleStatusChange(
  interaction: ButtonInteraction,
  status: "active" | "paused" | "left"
): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [participantId] = args;

  await setParticipantStatus(participantId, status);

  // sprintId wird für refreshJoinMessage gebraucht - der Datensatz existiert
  // auch nach "left" noch (nur der Status ändert sich), daher hier einmalig laden.
  const participant = await SprintParticipant.findById(participantId);

  if (status === "left") {
    await interaction.update({ content: Texts.participant.left, embeds: [], components: [] });
    if (participant) await refreshJoinMessage(interaction.client, participant.sprintId.toString());
    return;
  }

  if (!participant) {
    await interaction.reply({ content: Texts.errors.notInSprint, ephemeral: true });
    return;
  }

  const { embed, components } = buildParticipantPanel(participant);
  const statusText = status === "paused" ? Texts.participant.paused : Texts.participant.resumed;

  await interaction.update({ content: statusText, embeds: [embed], components });
  await refreshJoinMessage(interaction.client, participant.sprintId.toString());
}

export async function executePause(interaction: ButtonInteraction): Promise<void> {
  await handleStatusChange(interaction, "paused");
}

export async function executeResume(interaction: ButtonInteraction): Promise<void> {
  await handleStatusChange(interaction, "active");
}

export async function executeLeave(interaction: ButtonInteraction): Promise<void> {
  await handleStatusChange(interaction, "left");
}
