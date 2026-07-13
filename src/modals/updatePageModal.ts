import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { parsePositiveInt } from "../utils/parsing";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook, updateCurrentPage } from "../services/sprintService";
import { buildParticipantPanel } from "../embeds/participantPanelEmbed";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [participantId] = args;

  const newPage = parsePositiveInt(interaction.fields.getTextInputValue("currentPage"));

  const participant = await SprintParticipant.findById(participantId);
  if (!participant) {
    await interaction.reply({ content: Texts.errors.notInSprint, ephemeral: true });
    return;
  }

  const currentBook = getCurrentBook(participant);

  // Seite muss zwischen der Startseite (kein Rückschritt) und der Gesamtseitenzahl
  // liegen (kein "999999 Seiten gelesen"-Cheat).
  if (
    newPage === null ||
    !currentBook ||
    newPage < currentBook.startPage ||
    newPage > currentBook.totalPages
  ) {
    await interaction.reply({ content: Texts.participant.updatePageInvalid, ephemeral: true });
    return;
  }

  await updateCurrentPage(participant, newPage);

  const { embed, components } = buildParticipantPanel(participant);
  await interaction.reply({
    content: Texts.participant.updatePageSuccess,
    embeds: [embed],
    components,
    ephemeral: true,
  });
}
