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
import { getCurrentFieldLabel, getGoalFieldLabel } from "../services/bookProgress";

/**
 * Reagiert auf die Buchauswahl aus buttons/joinButton.ts.
 * - "Neues Buch" ausgewählt -> erst Format-Auswahl (siehe bookFormatSelect.ts),
 *   da Titel/Umfang je nach Format unterschiedliche Felder brauchen.
 * - vorhandenes Buch ausgewählt -> schlankes Modal (nur Fortschritt + optional
 *   Ziel, format-abhängig beschriftet), Titel/Umfang kommen aus der Bibliothek.
 *
 * Select-Menü-Interaktionen dürfen (wie Buttons) ein Modal ODER ein weiteres
 * Select-Menü als erste Antwort zeigen - deshalb kein deferReply hier.
 */
export async function execute(interaction: StringSelectMenuInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [sprintId] = args;
  const selectedValue = interaction.values[0];

  if (selectedValue === NEW_BOOK_SELECT_VALUE) {
    const select = new StringSelectMenuBuilder()
      .setCustomId(buildCustomId(CustomId.SELECT_NEW_BOOK_FORMAT, "join", sprintId))
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
  if (!book) {
    await interaction.update({ content: Texts.myBooks.notFound, components: [] });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(buildCustomId(CustomId.MODAL_JOIN_EXISTING_BOOK, sprintId, bookId))
    .setTitle(Texts.bookSelect.modalTitleExisting);

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
    new ActionRowBuilder<TextInputBuilder>().addComponents(currentInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(goalInput)
  );

  await interaction.showModal(modal);
}
