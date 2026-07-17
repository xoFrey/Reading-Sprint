import { ButtonInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { Book } from "../database/models/Book";

export async function execute(interaction: ButtonInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [bookId] = args;

  const book = await Book.findByIdAndDelete(bookId);
  if (!book) {
    await interaction.update({ content: Texts.myBooks.notFound, components: [] });
    return;
  }

  await interaction.update({ content: Texts.myBooks.deleteSuccess(book.title), components: [] });
}
