import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { parseNonNegativeInt } from "../utils/parsing";
import { Book } from "../database/models/Book";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook, updateCurrentPage, switchBook } from "../services/sprintService";
import { buildParticipantPanel } from "../embeds/participantPanelEmbed";
import { refreshJoinMessage } from "../services/joinMessageService";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [participantId, bookId] = args;

  const oldCurrentPage = parseNonNegativeInt(interaction.fields.getTextInputValue("oldCurrentPage"));
  const currentPage = parseNonNegativeInt(interaction.fields.getTextInputValue("currentPage"));
  const goalPageRaw = interaction.fields.getTextInputValue("goalPage");
  const goalPage = goalPageRaw ? parseNonNegativeInt(goalPageRaw) ?? undefined : undefined;

  const book = await Book.findById(bookId);
  const participant = await SprintParticipant.findById(participantId);

  if (!book || !participant || currentPage === null) {
    await interaction.reply({ content: Texts.errors.generic, ephemeral: true });
    return;
  }

  // Erst die Seite im BISHERIGEN Buch speichern (gleiche Validierung wie überall).
  const oldBook = getCurrentBook(participant);
  if (
    oldCurrentPage === null ||
    !oldBook ||
    oldCurrentPage < oldBook.startPage ||
    oldCurrentPage > oldBook.totalPages
  ) {
    await interaction.reply({ content: Texts.participant.updatePageInvalid, ephemeral: true });
    return;
  }
  await updateCurrentPage(participant, oldCurrentPage);

  const updatedParticipant = await switchBook(
    participantId,
    interaction.user.id,
    interaction.guildId!,
    book.title,
    currentPage,
    book.totalPages,
    goalPage
  );

  if (!updatedParticipant) {
    await interaction.reply({ content: Texts.errors.notInSprint, ephemeral: true });
    return;
  }

  const { embed, components } = buildParticipantPanel(updatedParticipant);

  await interaction.reply({
    content: Texts.participant.switchBookSuccess(book.title),
    embeds: [embed],
    components,
    ephemeral: true,
  });

  await refreshJoinMessage(interaction.client, updatedParticipant.sprintId.toString());
}
