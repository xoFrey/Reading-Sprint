import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { parseFormatValue } from "../services/bookProgress";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook, fixBookStart } from "../services/sprintService";
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
  const newValue = parseFormatValue(currentBook.format, interaction.fields.getTextInputValue("value"), percentMode);

  const total =
    currentBook.format === "audiobook" ? currentBook.totalMinutes : currentBook.totalPages;

  // Anders als bei "Fortschritt aktualisieren": hier ist 0 bis Gesamtumfang
  // erlaubt (kein Rückschritt-Verbot), da genau das der Zweck ist - den
  // Startpunkt frei zu korrigieren.
  if (newValue === null || total === undefined || newValue < 0 || newValue > total) {
    await interaction.reply({ content: Texts.participant.fixStartInvalid, ephemeral: true });
    return;
  }

  await fixBookStart(participant, newValue);

  const { embed, components } = buildParticipantPanel(participant);
  await interaction.reply({
    content: Texts.participant.fixStartSuccess,
    embeds: [embed],
    components,
    ephemeral: true,
  });

  await refreshJoinMessage(interaction.client, participant.sprintId.toString());
}
