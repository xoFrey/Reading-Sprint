import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { parseFormatValue, getProgressBounds } from "../services/bookProgress";
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

  const percentMode = currentBook.audiobookPercentMode === true;
  const newValue = parseFormatValue(
    currentBook.format,
    interaction.fields.getTextInputValue("current"),
    percentMode
  );

  // Wert muss zwischen dem Startwert (kein Rückschritt) und dem Gesamtumfang
  // liegen (kein "999999 Seiten gelesen"-Cheat). getProgressBounds kennt die
  // richtige Einheit (Seite/Prozent/Minute) automatisch.
  const bounds = getProgressBounds(currentBook);

  if (newValue === null || !bounds || newValue < bounds.start || newValue > bounds.max) {
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
