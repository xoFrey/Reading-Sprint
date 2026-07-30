import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { parseFormatValue, parseFormatValuePositive } from "../services/bookProgress";
import { Book } from "../database/models/Book";
import { Sprint } from "../database/models/Sprint";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { joinSprint, NewBookInput } from "../services/sprintService";
import { buildParticipantPanel } from "../embeds/participantPanelEmbed";
import { refreshJoinMessage } from "../services/joinMessageService";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [sprintId, bookId] = args;

  const book = await Book.findById(bookId);
  if (!book) {
    await interaction.reply({ content: Texts.myBooks.notFound, ephemeral: true });
    return;
  }

  const format = book.format;
  const total = format === "audiobook" ? book.totalMinutes! : book.totalPages!;

  const current = parseFormatValue(format, interaction.fields.getTextInputValue("current"));
  const goalRaw = interaction.fields.getTextInputValue("goal");
  const goalDelta = goalRaw ? parseFormatValuePositive(format, goalRaw) : null;

  if (current === null || (goalRaw && goalDelta === null)) {
    await interaction.reply({ content: Texts.join.invalidValue, ephemeral: true });
    return;
  }

  if (format === "ebook" && (current < 0 || current > 100)) {
    await interaction.reply({ content: Texts.join.invalidPercent, ephemeral: true });
    return;
  }

  if (current > total) {
    await interaction.reply({ content: Texts.join.currentPageExceedsTotal, ephemeral: true });
    return;
  }

  const sprint = await Sprint.findById(sprintId);
  if (!sprint || sprint.status !== "active") {
    await interaction.reply({ content: Texts.end.sprintOver, ephemeral: true });
    return;
  }

  const input: NewBookInput = {
    title: book.title,
    format,
    current,
    total,
    goalDelta: goalDelta ?? undefined,
  };

  let participant;
  try {
    // findOrCreateBook in joinSprint findet dieses Buch anhand des Titels
    // wieder (gleicher Nutzer, gleicher Server, unbeendet) - Titel/Umfang
    // müssen daher nicht erneut eingegeben werden.
    participant = await joinSprint(sprintId, interaction.user.id, interaction.guildId!, input);
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
