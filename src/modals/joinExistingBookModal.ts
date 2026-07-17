import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { parsePositiveInt } from "../utils/parsing";
import { Book } from "../database/models/Book";
import { joinSprint } from "../services/sprintService";
import { buildParticipantPanel } from "../embeds/participantPanelEmbed";
import { refreshJoinMessage } from "../services/joinMessageService";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [sprintId, bookId] = args;

  const currentPage = parsePositiveInt(interaction.fields.getTextInputValue("currentPage"));
  const goalPageRaw = interaction.fields.getTextInputValue("goalPage");
  const goalPage = goalPageRaw ? parsePositiveInt(goalPageRaw) ?? undefined : undefined;

  const book = await Book.findById(bookId);
  if (!book || currentPage === null) {
    await interaction.reply({ content: Texts.errors.generic, ephemeral: true });
    return;
  }

  let participant;
  try {
    // findOrCreateBook in joinSprint findet dieses Buch anhand des Titels
    // wieder (gleicher Nutzer, gleicher Server, unbeendet) - Titel/Gesamtseiten
    // müssen daher nicht erneut eingegeben werden.
    participant = await joinSprint(
      sprintId,
      interaction.user.id,
      interaction.guildId!,
      book.title,
      currentPage,
      book.totalPages,
      goalPage
    );
  } catch (error: any) {
    if (error?.code === 11000) {
      await interaction.reply({ content: Texts.join.alreadyJoined, ephemeral: true });
      return;
    }
    throw error;
  }

  const { embed, components } = buildParticipantPanel(participant);

  await interaction.reply({
    content: Texts.join.welcome(book.title),
    embeds: [embed],
    components,
    ephemeral: true,
  });

  await refreshJoinMessage(interaction.client, sprintId);
}
