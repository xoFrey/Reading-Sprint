import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { parseNonNegativeInt, parsePositiveInt } from "../utils/parsing";
import { Book } from "../database/models/Book";
import { Sprint } from "../database/models/Sprint";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { joinSprint } from "../services/sprintService";
import { buildParticipantPanel } from "../embeds/participantPanelEmbed";
import { refreshJoinMessage } from "../services/joinMessageService";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [sprintId, bookId] = args;

  const currentPage = parseNonNegativeInt(interaction.fields.getTextInputValue("currentPage"));
  const goalPagesRaw = interaction.fields.getTextInputValue("goalPage");
  const goalPagesToRead = goalPagesRaw ? parsePositiveInt(goalPagesRaw) : null;

  const book = await Book.findById(bookId);
  if (!book || currentPage === null || (goalPagesRaw && goalPagesToRead === null)) {
    await interaction.reply({ content: Texts.errors.generic, ephemeral: true });
    return;
  }

  if (currentPage > book.totalPages) {
    await interaction.reply({ content: Texts.join.currentPageExceedsTotal, ephemeral: true });
    return;
  }

  // Nutzer geben ein, WIE VIELE Seiten sie lesen wollen (nicht die absolute
  // Zielseite) - intern rechnen wir das auf die absolute Seite um.
  const goalPage = goalPagesToRead ? currentPage + goalPagesToRead : undefined;

  const sprint = await Sprint.findById(sprintId);
  if (!sprint || sprint.status !== "active") {
    await interaction.reply({ content: Texts.end.sprintOver, ephemeral: true });
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
      const existing = await SprintParticipant.findOne({ sprintId, userId: interaction.user.id });
      const message = existing?.status === "left" ? Texts.join.alreadyLeft : Texts.join.alreadyJoined;
      await interaction.reply({ content: message, ephemeral: true });
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
