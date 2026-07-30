import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { BookFormat } from "../types";
import { parseFormatValue, parseFormatValuePositive } from "../services/bookProgress";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook, updateBookProgress, switchBook, NewBookInput } from "../services/sprintService";
import { buildParticipantPanel } from "../embeds/participantPanelEmbed";
import { refreshJoinMessage } from "../services/joinMessageService";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [participantId, formatRaw] = args;
  const format = formatRaw as BookFormat;

  const participant = await SprintParticipant.findById(participantId);
  if (!participant) {
    await interaction.reply({ content: Texts.errors.notInSprint, ephemeral: true });
    return;
  }

  const oldBook = getCurrentBook(participant);
  const oldCurrent = oldBook
    ? parseFormatValue(oldBook.format, interaction.fields.getTextInputValue("oldCurrent"))
    : null;

  const title = interaction.fields.getTextInputValue("title").trim();
  const current = parseFormatValue(format, interaction.fields.getTextInputValue("current"));
  const total = parseFormatValuePositive(format, interaction.fields.getTextInputValue("total"));
  const goalRaw = interaction.fields.getTextInputValue("goal");
  const goalDelta = goalRaw ? parseFormatValuePositive(format, goalRaw) : null;

  if (current === null || total === null || (goalRaw && goalDelta === null)) {
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

  // Erst den Fortschritt im BISHERIGEN Buch speichern (gleiche Validierung
  // wie beim regulären "Fortschritt aktualisieren"), bevor überhaupt das
  // neue Buch angelegt wird.
  const oldTotal = oldBook
    ? oldBook.format === "audiobook"
      ? oldBook.totalMinutes
      : oldBook.totalPages
    : undefined;
  const oldStart = oldBook
    ? oldBook.format === "audiobook"
      ? oldBook.startMinutes
      : oldBook.format === "ebook"
        ? oldBook.startPercent
        : oldBook.startPage
    : undefined;

  if (
    oldCurrent === null ||
    !oldBook ||
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
    title,
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
    content: Texts.participant.switchBookSuccess(title),
    embeds: [embed],
    components,
    ephemeral: true,
  });

  await refreshJoinMessage(interaction.client, updatedParticipant.sprintId.toString());
}
