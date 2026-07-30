import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { parseFormatValue } from "../services/bookProgress";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook, updateBookProgress } from "../services/sprintService";
import { buildParticipantPanel } from "../embeds/participantPanelEmbed";
import { refreshJoinMessage } from "../services/joinMessageService";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [participantId] = args;

  const participant = await SprintParticipant.findById(participantId);
  if (!participant) {
    await interaction.reply({ content: Texts.errors.notInSprint, ephemeral: true });
    return;
  }

  const currentBook = getCurrentBook(participant);
  if (!currentBook) {
    await interaction.reply({ content: Texts.errors.notInSprint, ephemeral: true });
    return;
  }

  const newValue = parseFormatValue(currentBook.format, interaction.fields.getTextInputValue("current"));

  const start =
    currentBook.format === "audiobook"
      ? currentBook.startMinutes
      : currentBook.format === "ebook"
        ? currentBook.startPercent
        : currentBook.startPage;
  const total = currentBook.format === "audiobook" ? currentBook.totalMinutes : currentBook.totalPages;

  // Wert muss zwischen dem Startwert (kein Rückschritt) und dem Gesamtumfang
  // liegen (kein "999999 Seiten gelesen"-Cheat).
  if (
    newValue === null ||
    start === undefined ||
    total === undefined ||
    newValue < start ||
    newValue > total
  ) {
    await interaction.reply({ content: Texts.participant.updatePageInvalid, ephemeral: true });
    return;
  }

  await updateBookProgress(participant, newValue);

  const { embed, components } = buildParticipantPanel(participant);
  await interaction.reply({
    content: Texts.participant.updatePageSuccess,
    embeds: [embed],
    components,
    ephemeral: true,
  });

  await refreshJoinMessage(interaction.client, participant.sprintId.toString());
}
