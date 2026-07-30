import {
  StringSelectMenuInteraction,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import { CustomId, buildCustomId, parseCustomId, NEW_BOOK_SELECT_VALUE } from "../config/constants";
import { Texts } from "../config/texts";
import { Book } from "../database/models/Book";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook } from "../services/sprintService";
import { getCurrentFieldLabel, getGoalFieldLabel, getOldCurrentFieldLabel } from "../services/bookProgress";

/**
 * Reagiert auf die Buchauswahl aus buttons/switchBookButton.ts.
 * - "Neues Buch" -> erst Format-Auswahl (siehe bookFormatSelect.ts).
 * - vorhandenes Buch -> Modal mit "alte Seite" (Format des BISHERIGEN Buchs)
 *   + Fortschritt/Ziel (Format des NEUEN, gewählten Buchs) - Titel/Umfang
 *   kommen aus der Bibliothek.
 */
export async function execute(interaction: StringSelectMenuInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [participantId] = args;
  const selectedValue = interaction.values[0];

  if (selectedValue === NEW_BOOK_SELECT_VALUE) {
    const select = new StringSelectMenuBuilder()
      .setCustomId(buildCustomId(CustomId.SELECT_NEW_BOOK_FORMAT, "switch", participantId))
      .setPlaceholder(Texts.bookFormat.selectPlaceholder)
      .addOptions(
        { label: Texts.bookFormat.physicalLabel, value: "physical", description: Texts.bookFormat.physicalDescription },
        { label: Texts.bookFormat.ebookLabel, value: "ebook", description: Texts.bookFormat.ebookDescription },
        { label: Texts.bookFormat.audiobookLabel, value: "audiobook", description: Texts.bookFormat.audiobookDescription }
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
    await interaction.update({ content: Texts.bookFormat.selectPrompt, components: [row] });
    return;
  }

  // selectedValue ist hier die Book._id aus der Bibliothek.
  const bookId = selectedValue;
  const book = await Book.findById(bookId);
  const participant = await SprintParticipant.findById(participantId);
  const oldBook = participant ? getCurrentBook(participant) : undefined;

  if (!book || !oldBook) {
    await interaction.update({ content: Texts.myBooks.notFound, components: [] });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(buildCustomId(CustomId.MODAL_SWITCH_TO_EXISTING_BOOK, participantId, bookId))
    .setTitle(Texts.bookSelect.modalTitleExisting);

  const oldCurrentInput = new TextInputBuilder()
    .setCustomId("oldCurrent")
    .setLabel(getOldCurrentFieldLabel(oldBook.format))
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const currentInput = new TextInputBuilder()
    .setCustomId("current")
    .setLabel(getCurrentFieldLabel(book.format))
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const goalInput = new TextInputBuilder()
    .setCustomId("goal")
    .setLabel(getGoalFieldLabel(book.format))
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(oldCurrentInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(currentInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(goalInput)
  );

  await interaction.showModal(modal);
}
