import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { Book } from "../database/models/Book";
import { parseFormatValuePositive } from "../services/bookProgress";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [bookId] = args;

  const book = await Book.findById(bookId);
  if (!book) {
    await interaction.reply({ content: Texts.myBooks.notFound, ephemeral: true });
    return;
  }

  const title = interaction.fields.getTextInputValue("title").trim();
  const total = parseFormatValuePositive(book.format, interaction.fields.getTextInputValue("total"));

  if (!title || total === null) {
    await interaction.reply({ content: Texts.join.invalidValue, ephemeral: true });
    return;
  }

  book.title = title;
  if (book.format === "audiobook") {
    book.totalMinutes = total;
  } else {
    book.totalPages = total;
  }
  await book.save();

  await interaction.reply({ content: Texts.myBooks.editSuccess, ephemeral: true });
}
