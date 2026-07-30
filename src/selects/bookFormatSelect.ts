import {
  StringSelectMenuInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import { CustomId, buildCustomId, parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { BookFormat } from "../types";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook } from "../services/sprintService";
import {
  getCurrentFieldLabel,
  getTotalFieldLabel,
  getGoalFieldLabel,
  getOldCurrentFieldLabel,
} from "../services/bookProgress";

/**
 * Reagiert auf die Format-Auswahl für ein NEUES Buch (Beitritt oder
 * Buchwechsel, siehe joinBookSelect.ts / switchBookSelect.ts). Baut je nach
 * gewähltem Format (Physisch/Ebook/Hörbuch) das passend beschriftete Modal.
 *
 * customId-Args: [mode, id] - mode ist "join" (id=sprintId) oder "switch"
 * (id=participantId, braucht zusätzlich das Format des BISHERIGEN Buchs für
 * die "alte Seite"-Abfrage).
 */
export async function execute(interaction: StringSelectMenuInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [mode, id] = args;
  const format = interaction.values[0] as BookFormat;

  const titleInput = new TextInputBuilder()
    .setCustomId("title")
    .setLabel(Texts.join.bookTitleLabel)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const currentInput = new TextInputBuilder()
    .setCustomId("current")
    .setLabel(getCurrentFieldLabel(format))
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const totalInput = new TextInputBuilder()
    .setCustomId("total")
    .setLabel(getTotalFieldLabel(format))
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const goalInput = new TextInputBuilder()
    .setCustomId("goal")
    .setLabel(getGoalFieldLabel(format))
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  if (mode === "join") {
    const modal = new ModalBuilder()
      .setCustomId(buildCustomId(CustomId.MODAL_JOIN, id, format))
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

  // mode === "switch": Format des BISHERIGEN Buchs wird gebraucht, um die
  // "alte Seite"-Abfrage korrekt zu beschriften.
  const participant = await SprintParticipant.findById(id);
  const oldBook = participant ? getCurrentBook(participant) : undefined;
  const oldFormat: BookFormat = oldBook?.format ?? "physical";

  const oldCurrentInput = new TextInputBuilder()
    .setCustomId("oldCurrent")
    .setLabel(getOldCurrentFieldLabel(oldFormat))
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const modal = new ModalBuilder()
    .setCustomId(buildCustomId(CustomId.MODAL_SWITCH_BOOK, id, format))
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
