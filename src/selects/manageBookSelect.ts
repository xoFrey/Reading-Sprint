import { StringSelectMenuInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { CustomId, buildCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { Book } from "../database/models/Book";

export async function execute(interaction: StringSelectMenuInteraction): Promise<void> {
  const bookId = interaction.values[0];

  const book = await Book.findById(bookId);
  if (!book) {
    await interaction.update({ content: Texts.myBooks.notFound, components: [] });
    return;
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(buildCustomId(CustomId.BOOK_EDIT, book.id))
      .setLabel(Texts.myBooks.editButtonLabel)
      .setEmoji("✏️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(buildCustomId(CustomId.BOOK_DELETE, book.id))
      .setLabel(Texts.myBooks.deleteButtonLabel)
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.update({ content: Texts.myBooks.managePrompt(book.title), components: [row] });
}
