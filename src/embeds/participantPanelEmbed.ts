import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Colors, CustomId, buildCustomId } from "../config/constants";
import { ISprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook } from "../services/sprintService";

/**
 * Baut das private (ephemeral) Panel, das ein Teilnehmer nach dem Beitritt sieht.
 * Wird nach jeder Aktion (Seitenzahl ändern, Buch wechseln, ...) neu aufgebaut
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
    const pagesRead = currentBook.currentPage - currentBook.startPage;
    embed.addFields(
      { name: "Buch", value: currentBook.title, inline: true },
      {
        name: "Seite",
        value: `${currentBook.currentPage} / ${currentBook.totalPages}`,
        inline: true,
      },
      { name: "Gelesen in diesem Sprint", value: `${Math.max(0, pagesRead)} Seiten`, inline: true }
    );

    if (currentBook.goalPage) {
      embed.addFields({ name: "Ziel", value: `Seite ${currentBook.goalPage}`, inline: true });
    }
  }

  const statusLabel =
    participant.status === "paused" ? "⏸️ Pausiert" : "▶️ Aktiv";
  embed.setFooter({ text: statusLabel });

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(buildCustomId(CustomId.PARTICIPANT_UPDATE_PAGE, participant.id))
      .setLabel("Seite aktualisieren")
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
