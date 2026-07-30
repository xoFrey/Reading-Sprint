import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { parseFormatValue, parseFormatValuePositive } from "../services/bookProgress";
import { Book } from "../database/models/Book";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook, updateBookProgress, switchBook, NewBookInput } from "../services/sprintService";
import { buildParticipantPanel } from "../embeds/participantPanelEmbed";
import { refreshJoinMessage } from "../services/joinMessageService";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [participantId, bookId] = args;

  const book = await Book.findById(bookId);
  const participant = await SprintParticipant.findById(participantId);
  const oldBook = participant ? getCurrentBook(participant) : undefined;

  if (!book || !participant || !oldBook) {
    await interaction.reply({ content: Texts.errors.generic, ephemeral: true });
    return;
  }

  const format = book.format;
  const total = format === "audiobook" ? book.totalMinutes! : book.totalPages!;

  const oldCurrent = parseFormatValue(oldBook.format, interaction.fields.getTextInputValue("oldCurrent"));
  const current = parseFormatValue(format, interaction.fields.getTextInputValue("current"));
  const goalRaw = interaction.fields.getTextInputValue("goal");
  const goalDelta = goalRaw ? parseFormatValuePositive(format, goalRaw) : null;

  if (current === null || (goalRaw && goalDelta === null)) {
    await interaction.reply({ content: Texts.join.invalidValue, ephemeral: true });
    return;
  }

  if (format === "ebook" && (current < 0 || current > 100)) {
    await interaction.reply({ content: Texts.join.invalidPercent, ephemeral: true });
    return;
  }

  if (current > total) {
    await interaction.reply({ content: Texts.join.currentPageExceedsTotal, ephemeral: true });
    return;
  }

  // Erst den Fortschritt im BISHERIGEN Buch speichern (gleiche Validierung wie überall).
  const oldTotal = oldBook.format === "audiobook" ? oldBook.totalMinutes : oldBook.totalPages;
  const oldStart =
    oldBook.format === "audiobook"
      ? oldBook.startMinutes
      : oldBook.format === "ebook"
        ? oldBook.startPercent
        : oldBook.startPage;

  if (
    oldCurrent === null ||
    oldStart === undefined ||
    oldTotal === undefined ||
    oldCurrent < oldStart ||
    oldCurrent > oldTotal
  ) {
    await interaction.reply({ content: Texts.participant.updatePageInvalid, ephemeral: true });
    return;
  }
  await updateBookProgress(participant, oldCurrent);

  const input: NewBookInput = {
    title: book.title,
    format,
    current,
    total,
    goalDelta: goalDelta ?? undefined,
  };

  const updatedParticipant = await switchBook(
    participantId,
    interaction.user.id,
    interaction.guildId!,
    input
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
