import {
  StringSelectMenuInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import { CustomId, buildCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { BookFormat } from "../types";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook } from "../services/sprintService";
import {
  getCurrentFieldLabel,
  getTotalFieldLabel,
  getGoalFieldLabel,
  getGoalFieldPlaceholder,
  getOldCurrentFieldLabel,
  getCurrentValue,
  formatValueForInput,
} from "../services/bookProgress";

/**
 * Baut und zeigt das Modal für ein NEUES Buch (Beitritt oder Buchwechsel),
 * nachdem Format (und bei Hörbüchern: Eingabe-Modus) feststehen. Wird von
 * bookFormatSelect.ts (physisch/ebook, percentMode irrelevant) UND von
 * audiobookModeSelect.ts (Hörbuch, percentMode entscheidet Std:Min vs. %)
 * aufgerufen, damit die Modal-Struktur nicht doppelt gepflegt werden muss.
 *
 * customId-Args davor: [mode, id] - mode ist "join" (id=sprintId) oder
 * "switch" (id=participantId, braucht zusätzlich das Format DES BISHERIGEN
 * Buchs für die "alte Seite"-Abfrage).
 */
export async function showNewBookModal(
  interaction: StringSelectMenuInteraction,
  mode: string,
  id: string,
  format: BookFormat,
  percentMode: boolean
): Promise<void> {
  const titleInput = new TextInputBuilder()
    .setCustomId("title")
    .setLabel(Texts.join.bookTitleLabel)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const currentInput = new TextInputBuilder()
    .setCustomId("current")
    .setLabel(getCurrentFieldLabel(format, percentMode))
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const totalInput = new TextInputBuilder()
    .setCustomId("total")
    .setLabel(getTotalFieldLabel(format))
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const goalInput = new TextInputBuilder()
    .setCustomId("goal")
    .setLabel(getGoalFieldLabel(format, percentMode))
    .setPlaceholder(getGoalFieldPlaceholder(format, percentMode))
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  // percentMode wird als drittes bzw. viertes customId-Arg mitgegeben ("1"/"0"),
  // damit der Modal-Handler beim Absenden weiß, wie er "current"/"goal" parsen muss.
  const percentFlag = percentMode ? "1" : "0";

  if (mode === "join") {
    const modal = new ModalBuilder()
      .setCustomId(buildCustomId(CustomId.MODAL_JOIN, id, format, percentFlag))
      .setTitle(Texts.join.modalTitle);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(currentInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(totalInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(goalInput)
    );

    await interaction.showModal(modal);
    return;
  }

  // mode === "switch": Format (und ggf. %-Modus) des BISHERIGEN Buchs wird
  // gebraucht, um die "alte Seite"-Abfrage korrekt zu beschriften/parsen.
  const participant = await SprintParticipant.findById(id);
  const oldBook = participant ? getCurrentBook(participant) : undefined;
  const oldFormat: BookFormat = oldBook?.format ?? "physical";
  const oldPercentMode = oldBook?.audiobookPercentMode === true;

  const oldCurrentInput = new TextInputBuilder()
    .setCustomId("oldCurrent")
    .setLabel(getOldCurrentFieldLabel(oldFormat, oldPercentMode))
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  // Vorausfüllen mit dem zuletzt eingetragenen Stand des BISHERIGEN Buchs -
  // meistens hat sich seitdem ja nichts geändert, spart in dem Fall Tippen.
  const oldCurrentValue = oldBook ? getCurrentValue(oldBook) : undefined;
  if (oldCurrentValue !== undefined) {
    oldCurrentInput.setValue(formatValueForInput(oldFormat, oldCurrentValue, oldPercentMode));
  }

  const modal = new ModalBuilder()
    .setCustomId(buildCustomId(CustomId.MODAL_SWITCH_BOOK, id, format, percentFlag))
    .setTitle(Texts.join.modalTitle);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(oldCurrentInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(currentInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(totalInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(goalInput)
  );

  await interaction.showModal(modal);
}
