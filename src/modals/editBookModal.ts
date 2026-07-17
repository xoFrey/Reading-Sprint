import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { parsePositiveInt } from "../utils/parsing";
import { Book } from "../database/models/Book";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [bookId] = args;

  const title = interaction.fields.getTextInputValue("title").trim();
  const totalPages = parsePositiveInt(interaction.fields.getTextInputValue("totalPages"));

  if (!title || totalPages === null) {
    await interaction.reply({ content: Texts.errors.generic, ephemeral: true });
    return;
  }

  const book = await Book.findByIdAndUpdate(bookId, { title, totalPages }, { new: true });
  if (!book) {
    await interaction.reply({ content: Texts.myBooks.notFound, ephemeral: true });
    return;
  }

  await interaction.reply({ content: Texts.myBooks.editSuccess, ephemeral: true });
}
