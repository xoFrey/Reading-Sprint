import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import { CustomId, buildCustomId, parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { Book } from "../database/models/Book";

export async function execute(interaction: ButtonInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [bookId] = args;

  const book = await Book.findById(bookId);
  if (!book) {
    await interaction.reply({ content: Texts.myBooks.notFound, ephemeral: true });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(buildCustomId(CustomId.MODAL_EDIT_BOOK, bookId))
    .setTitle(Texts.myBooks.editModalTitle);

  const titleInput = new TextInputBuilder()
    .setCustomId("title")
    .setLabel(Texts.join.bookTitleLabel)
    .setStyle(TextInputStyle.Short)
    .setValue(book.title)
    .setRequired(true);

  const totalPagesInput = new TextInputBuilder()
    .setCustomId("totalPages")
    .setLabel(Texts.join.totalPagesLabel)
    .setStyle(TextInputStyle.Short)
    .setValue(String(book.totalPages))
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(totalPagesInput)
  );

  await interaction.showModal(modal);
}
