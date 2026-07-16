import {
  StringSelectMenuInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import { CustomId, buildCustomId, parseCustomId, NEW_BOOK_SELECT_VALUE } from "../config/constants";
import { Texts } from "../config/texts";

/**
 * Reagiert auf die Buchauswahl aus buttons/joinButton.ts.
 * - "Neues Buch" ausgewählt -> volles Modal (Titel, Seite, Gesamtseiten, Ziel).
 * - vorhandenes Buch ausgewählt -> schlankes Modal (nur Seite + optional Ziel),
 *   Titel/Gesamtseiten kommen aus der Bibliothek (siehe joinExistingBookModal.ts).
 *
 * Select-Menü-Interaktionen dürfen (wie Buttons) ein Modal als erste Antwort
 * zeigen - deshalb kein deferReply hier, sondern direkt showModal.
 */
export async function execute(interaction: StringSelectMenuInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [sprintId] = args;
  const selectedValue = interaction.values[0];

  if (selectedValue === NEW_BOOK_SELECT_VALUE) {
    const modal = new ModalBuilder()
      .setCustomId(buildCustomId(CustomId.MODAL_JOIN, sprintId))
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

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(currentPageInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(totalPagesInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(goalPageInput)
    );

    await interaction.showModal(modal);
    return;
  }

  // selectedValue ist hier die Book._id aus der Bibliothek.
  const bookId = selectedValue;

  const modal = new ModalBuilder()
    .setCustomId(buildCustomId(CustomId.MODAL_JOIN_EXISTING_BOOK, sprintId, bookId))
    .setTitle(Texts.bookSelect.modalTitleExisting);

  const currentPageInput = new TextInputBuilder()
    .setCustomId("currentPage")
    .setLabel(Texts.join.currentPageLabel)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const goalPageInput = new TextInputBuilder()
    .setCustomId("goalPage")
    .setLabel(Texts.join.goalPageLabel)
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(currentPageInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(goalPageInput)
  );

  await interaction.showModal(modal);
}
