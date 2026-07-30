import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import { CustomId, buildCustomId, parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook } from "../services/sprintService";
import { getCurrentFieldLabel } from "../services/bookProgress";

/**
 * Fragt (wie graceUpdatePageButton.ts) den Teilnehmer-Datensatz ab, um das
 * Modal-Feld format-abhängig zu beschriften (Seite/Prozent/Std:Min).
 */
export async function execute(interaction: ButtonInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [participantId] = args;

  const participant = await SprintParticipant.findById(participantId);
  const currentBook = participant ? getCurrentBook(participant) : undefined;

  const modal = new ModalBuilder()
    .setCustomId(buildCustomId(CustomId.MODAL_UPDATE_PAGE, participantId))
    .setTitle(Texts.participant.updatePageModalTitle);

  const valueInput = new TextInputBuilder()
    .setCustomId("current")
    .setLabel(currentBook ? getCurrentFieldLabel(currentBook.format) : Texts.participant.updatePageLabel)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(valueInput));

  await interaction.showModal(modal);
}
