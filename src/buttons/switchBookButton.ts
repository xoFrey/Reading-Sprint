import {
  ButtonInteraction,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} from "discord.js";
import { CustomId, buildCustomId, parseCustomId, NEW_BOOK_SELECT_VALUE } from "../config/constants";
import { Texts } from "../config/texts";
import { getUnfinishedBooks } from "../services/bookService";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { getCurrentBook } from "../services/sprintService";

/**
 * Gleicher Ansatz wie beim Sprint-Beitritt (siehe joinButton.ts): erst
 * Bibliotheks-Auswahl zeigen, dann je nach Auswahl das passende Modal.
 * Das aktuell gelesene Buch wird aus der Liste ausgeschlossen (Wechsel zum
 * selben Buch ergibt keinen Sinn).
 */
export async function execute(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const { args } = parseCustomId(interaction.customId);
  const [participantId] = args;

  const participant = await SprintParticipant.findById(participantId);
  const currentBookTitle = participant ? getCurrentBook(participant)?.title.toLowerCase() : undefined;

  const unfinishedBooks = (await getUnfinishedBooks(interaction.user.id, interaction.guildId!)).filter(
    (book) => book.title.toLowerCase() !== currentBookTitle
  );

  const select = new StringSelectMenuBuilder()
    .setCustomId(buildCustomId(CustomId.SELECT_SWITCH_BOOK, participantId))
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
