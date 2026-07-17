import { ButtonInteraction, StringSelectMenuBuilder, ActionRowBuilder } from "discord.js";
import { CustomId, buildCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { Book } from "../database/models/Book";

const MAX_BOOKS_SHOWN = 25; // Discord-Limit für Select-Menü-Optionen

export async function execute(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const books = await Book.find({ userId: interaction.user.id, guildId: interaction.guildId }).sort({
    updatedAt: -1,
  });

  if (books.length === 0) {
    await interaction.editReply({ content: Texts.myBooks.noBooks });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(buildCustomId(CustomId.SELECT_MANAGE_BOOK))
    .setPlaceholder(Texts.myBooks.placeholder)
    .addOptions(
      books.slice(0, MAX_BOOKS_SHOWN).map((book) => ({
        label: book.title.slice(0, 100),
        value: book.id,
        description: `${book.totalPages} Seiten${book.isFinished ? " · Beendet" : ""}`.slice(0, 100),
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.editReply({ content: Texts.myBooks.prompt, components: [row] });
}
