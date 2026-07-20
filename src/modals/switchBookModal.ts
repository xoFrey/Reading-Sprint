import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { parsePositiveInt, parseNonNegativeInt } from "../utils/parsing";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook, updateCurrentPage, switchBook } from "../services/sprintService";
import { buildParticipantPanel } from "../embeds/participantPanelEmbed";
import { refreshJoinMessage } from "../services/joinMessageService";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [participantId] = args;

  const oldCurrentPage = parseNonNegativeInt(interaction.fields.getTextInputValue("oldCurrentPage"));
  const title = interaction.fields.getTextInputValue("title").trim();
  const currentPage = parseNonNegativeInt(interaction.fields.getTextInputValue("currentPage"));
  const totalPages = parsePositiveInt(interaction.fields.getTextInputValue("totalPages"));
  const goalPageRaw = interaction.fields.getTextInputValue("goalPage");
  const goalPage = goalPageRaw ? parseNonNegativeInt(goalPageRaw) ?? undefined : undefined;

  if (currentPage === null || totalPages === null) {
    await interaction.reply({ content: Texts.errors.generic, ephemeral: true });
    return;
  }

  const participant = await SprintParticipant.findById(participantId);
  if (!participant) {
    await interaction.reply({ content: Texts.errors.notInSprint, ephemeral: true });
    return;
  }

  // Erst die Seite im BISHERIGEN Buch speichern (gleiche Validierung wie beim
  // regulären "Seite aktualisieren" - kein Rückschritt, keine Seite jenseits
  // der Gesamtseitenzahl), bevor überhaupt das neue Buch angelegt wird.
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
    title,
    currentPage,
    totalPages,
    goalPage
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
