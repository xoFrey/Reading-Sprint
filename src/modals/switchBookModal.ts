import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { BookFormat } from "../types";
import { parseFormatValue, parseFormatValuePositive, parseGoalValue, getProgressBounds } from "../services/bookProgress";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook, updateBookProgress, switchBook, NewBookInput } from "../services/sprintService";
import { buildParticipantPanel } from "../embeds/participantPanelEmbed";
import { refreshJoinMessage } from "../services/joinMessageService";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [participantId, formatRaw, percentFlag] = args;
  const format = formatRaw as BookFormat;
  const percentMode = format === "audiobook" && percentFlag === "1";
  const isPercentInput = format === "ebook" || percentMode;

  const participant = await SprintParticipant.findById(participantId);
  if (!participant) {
    await interaction.reply({ content: Texts.errors.notInSprint, ephemeral: true });
    return;
  }

  const oldBook = getCurrentBook(participant);
  // oldBook.audiobookPercentMode ist bereits in der DB gespeichert (vom
  // Zeitpunkt, als dieses Buch begonnen wurde) - kein extra Flag nötig.
  const oldPercentMode = oldBook?.audiobookPercentMode === true;
  const oldCurrent = oldBook
    ? parseFormatValue(oldBook.format, interaction.fields.getTextInputValue("oldCurrent"), oldPercentMode)
    : null;

  const title = interaction.fields.getTextInputValue("title").trim();
  const current = parseFormatValue(format, interaction.fields.getTextInputValue("current"), percentMode);
  const total = parseFormatValuePositive(format, interaction.fields.getTextInputValue("total"));
  const goalRaw = interaction.fields.getTextInputValue("goal");
  const parsedGoal = parseGoalValue(format, goalRaw, percentMode);

  if (current === null || total === null || parsedGoal === null) {
    await interaction.reply({ content: Texts.join.invalidValue, ephemeral: true });
    return;
  }

  if (isPercentInput && (current < 0 || current > 100)) {
    await interaction.reply({ content: Texts.join.invalidPercent, ephemeral: true });
    return;
  }

  if (!isPercentInput && current > total) {
    await interaction.reply({ content: Texts.join.currentPageExceedsTotal, ephemeral: true });
    return;
  }

  // Erst den Fortschritt im BISHERIGEN Buch speichern (gleiche Validierung
  // wie beim regulären "Fortschritt aktualisieren"), bevor überhaupt das
  // neue Buch angelegt wird.
  const oldBounds = oldBook ? getProgressBounds(oldBook) : undefined;

  if (oldCurrent === null || !oldBounds || oldCurrent < oldBounds.start || oldCurrent > oldBounds.max) {
    await interaction.reply({ content: Texts.participant.updatePageInvalid, ephemeral: true });
    return;
  }
  await updateBookProgress(participant, oldCurrent);

  const input: NewBookInput = {
    title,
    format,
    current,
    total,
    goalDelta: parsedGoal.delta,
    goalAbsolute: parsedGoal.absolute,
    audiobookPercentMode: format === "audiobook" ? percentMode : undefined,
  };

  const updatedParticipant = await switchBook(
    participantId,
    interaction.user.id,
    participant.guildId,
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
