import {
  ButtonInteraction,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} from "discord.js";
import { CustomId, buildCustomId, parseCustomId, NEW_BOOK_SELECT_VALUE } from "../config/constants";
import { Texts } from "../config/texts";
import { getUnfinishedBooks } from "../services/bookService";

/**
 * Zeigt zuerst eine Dropdown-Auswahl der unbeendeten Bücher aus der
 * persönlichen Bibliothek (siehe bookService.getUnfinishedBooks), damit ein
 * Buch aus einem vorherigen Sprint fortgesetzt werden kann, ohne Titel und
 * Gesamtseitenzahl erneut einzutippen. "Neues Buch" ist immer als Option dabei.
 *
 * deferReply() zuerst (statt showModal direkt), da wir vor der ersten Antwort
 * die Bibliothek abfragen müssen - ein Select-Menü kann (anders als ein Modal)
 * per editReply() nach einem deferReply() nachgereicht werden.
 */
export async function execute(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const { args } = parseCustomId(interaction.customId);
  const [sprintId] = args;

  const unfinishedBooks = await getUnfinishedBooks(interaction.user.id, interaction.guildId!);

  const select = new StringSelectMenuBuilder()
    .setCustomId(buildCustomId(CustomId.SELECT_JOIN_BOOK, sprintId))
    .setPlaceholder(Texts.bookSelect.placeholder)
    .addOptions(
      ...unfinishedBooks.map((book) => ({
        label: book.title.slice(0, 100),
        value: book.id,
        description: Texts.bookSelect.bookOptionDescription(book.totalPages).slice(0, 100),
      })),
      {
        label: Texts.bookSelect.newBookOptionLabel,
        value: NEW_BOOK_SELECT_VALUE,
        description: Texts.bookSelect.newBookOptionDescription,
      }
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.editReply({ content: Texts.bookSelect.prompt, components: [row] });
}
