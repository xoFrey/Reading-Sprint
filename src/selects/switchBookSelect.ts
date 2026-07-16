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
 * Reagiert auf die Buchauswahl aus buttons/switchBookButton.ts.
 * - "Neues Buch" -> das bekannte 5-Felder-Modal (alte Seite + neues Buch komplett).
 * - vorhandenes Buch -> schlankes 3-Felder-Modal (alte Seite, neue Seite, Ziel),
 *   Titel/Gesamtseiten kommen aus der Bibliothek (siehe switchToExistingBookModal.ts).
 */
export async function execute(interaction: StringSelectMenuInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [participantId] = args;
  const selectedValue = interaction.values[0];

  if (selectedValue === NEW_BOOK_SELECT_VALUE) {
    const modal = new ModalBuilder()
      .setCustomId(buildCustomId(CustomId.MODAL_SWITCH_BOOK, participantId))
      .setTitle(Texts.join.modalTitle);

    const oldPageInput = new TextInputBuilder()
      .setCustomId("oldCurrentPage")
      .setLabel(Texts.participant.oldBookPageLabel)
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

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
      new ActionRowBuilder<TextInputBuilder>().addComponents(oldPageInput),
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
    .setCustomId(buildCustomId(CustomId.MODAL_SWITCH_TO_EXISTING_BOOK, participantId, bookId))
    .setTitle(Texts.bookSelect.modalTitleExisting);

  const oldPageInput = new TextInputBuilder()
    .setCustomId("oldCurrentPage")
    .setLabel(Texts.participant.oldBookPageLabel)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

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
    new ActionRowBuilder<TextInputBuilder>().addComponents(oldPageInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(currentPageInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(goalPageInput)
  );

  await interaction.showModal(modal);
}
