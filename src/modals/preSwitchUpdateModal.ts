import { ModalSubmitInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import { CustomId, buildCustomId, parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { parsePositiveInt } from "../utils/parsing";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook, updateCurrentPage } from "../services/sprintService";

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

  // Gleiche Validierung wie beim regulären "Seite aktualisieren" (siehe updatePageModal.ts):
  // kein Rückschritt, keine Seite jenseits der Gesamtseitenzahl.
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

  // Direkt das nächste Modal zeigen (Modal-Chaining): Discord erlaubt, auf eine
  // Modal-Submission mit einem weiteren Modal zu antworten. So bleibt der
  // Buchwechsel für den Nutzer ein durchgängiger Zwei-Schritte-Vorgang.
  const nextModal = new ModalBuilder()
    .setCustomId(buildCustomId(CustomId.MODAL_SWITCH_BOOK, participantId))
    .setTitle(Texts.join.modalTitle);

  const titleInput = new TextInputBuilder()
    .setCustomId("title")
    .setLabel(Texts.join.bookTitleLabel)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const currentPageInput = new TextInputBuilder()
    .setCustomId("currentPage")
    .setLabel(Texts.join.currentPageLabel)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const totalPagesInput = new TextInputBuilder()
    .setCustomId("totalPages")
    .setLabel(Texts.join.totalPagesLabel)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const goalPageInput = new TextInputBuilder()
    .setCustomId("goalPage")
    .setLabel(Texts.join.goalPageLabel)
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  nextModal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(currentPageInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(totalPagesInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(goalPageInput)
  );

  await interaction.showModal(nextModal);
}
