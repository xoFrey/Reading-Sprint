import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Colors, CustomId, buildCustomId } from "../config/constants";
import { ISprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook } from "../services/sprintService";
import { formatCurrentProgress, formatDeltaProgress, formatGoal, formatLabel } from "../services/bookProgress";

/**
 * Baut das private (ephemeral) Panel, das ein Teilnehmer nach dem Beitritt sieht.
 * Wird nach jeder Aktion (Fortschritt ändern, Buch wechseln, ...) neu aufgebaut
 * und per interaction.update() aktualisiert.
 */
export function buildParticipantPanel(
  participant: ISprintParticipant
): { embed: EmbedBuilder; components: ActionRowBuilder<ButtonBuilder>[] } {
  const currentBook = getCurrentBook(participant);

  const embed = new EmbedBuilder()
    .setColor(Colors.neutral)
    .setTitle("📖 Dein Sprint-Fortschritt");

  if (currentBook) {
    embed.addFields(
      { name: "Buch", value: `${currentBook.title} (${formatLabel(currentBook.format)})`, inline: true },
      { name: "Stand", value: formatCurrentProgress(currentBook), inline: true },
      { name: "Gelesen/Gehört in diesem Sprint", value: formatDeltaProgress(currentBook), inline: true }
    );

    const goalText = formatGoal(currentBook);
    if (goalText) {
      embed.addFields({ name: "Ziel", value: goalText, inline: true });
    }
  }

  const statusLabel =
    participant.status === "paused" ? "⏸️ Pausiert" : "▶️ Aktiv";
  embed.setFooter({ text: statusLabel });

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(buildCustomId(CustomId.PARTICIPANT_UPDATE_PAGE, participant.id))
      .setLabel("Fortschritt aktualisieren")
      .setEmoji("✏️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(buildCustomId(CustomId.PARTICIPANT_SWITCH_BOOK, participant.id))
      .setLabel("Buch wechseln")
      .setEmoji("📖")
      .setStyle(ButtonStyle.Secondary),
    participant.status === "paused"
      ? new ButtonBuilder()
          .setCustomId(buildCustomId(CustomId.PARTICIPANT_RESUME, participant.id))
          .setLabel("Weiter")
          .setEmoji("▶️")
          .setStyle(ButtonStyle.Success)
      : new ButtonBuilder()
          .setCustomId(buildCustomId(CustomId.PARTICIPANT_PAUSE, participant.id))
          .setLabel("Pause")
          .setEmoji("⏸️")
          .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(buildCustomId(CustomId.PARTICIPANT_LEAVE, participant.id))
      .setLabel("Verlassen")
      .setEmoji("🚪")
      .setStyle(ButtonStyle.Danger)
  );

  return { embed, components: [row1] };
}
