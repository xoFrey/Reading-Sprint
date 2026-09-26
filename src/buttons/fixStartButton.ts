import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import { CustomId, buildCustomId, parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook } from "../services/sprintService";
import { getFixStartFieldLabel, getGoalFieldLabel, getGoalFieldPlaceholder } from "../services/bookProgress";

/**
 * Öffnet das Modal zur Startwert-Korrektur - z.B. wenn der beim Auto-Join
 * (vorregistrierte Nutzer, siehe jobs/scheduler.ts) vorausgefüllte Startwert
 * nicht mehr stimmt, weil zwischen den Sprints außerhalb weitergelesen wurde.
 */
export async function execute(interaction: ButtonInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [participantId] = args;

  const participant = await SprintParticipant.findById(participantId);
  const currentBook = participant ? getCurrentBook(participant) : undefined;

  const modal = new ModalBuilder()
    .setCustomId(buildCustomId(CustomId.MODAL_FIX_START, participantId))
    .setTitle(Texts.participant.fixStartModalTitle);

  const valueInput = new TextInputBuilder()
    .setCustomId("value")
    .setLabel(
      currentBook
        ? getFixStartFieldLabel(currentBook.format, currentBook.audiobookPercentMode === true)
        : Texts.participant.updatePageLabel
    )
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  // Leer lassen = ein bereits gesetztes Ziel verschiebt sich automatisch mit
  // (siehe fixBookStart) - ausfüllen = neues Ziel setzen/überschreiben.
  const goalInput = new TextInputBuilder()
    .setCustomId("goal")
    .setLabel(
      currentBook
        ? getGoalFieldLabel(currentBook.format, currentBook.audiobookPercentMode === true)
        : Texts.participant.updatePageLabel
    )
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  if (currentBook) {
    goalInput.setPlaceholder(getGoalFieldPlaceholder(currentBook.format, currentBook.audiobookPercentMode === true));
  }

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(valueInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(goalInput)
  );

  await interaction.showModal(modal);
}
