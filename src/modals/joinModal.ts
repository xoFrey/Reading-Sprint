import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { BookFormat } from "../types";
import { parseFormatValue, parseFormatValuePositive } from "../services/bookProgress";
import { joinSprint, NewBookInput } from "../services/sprintService";
import { buildParticipantPanel } from "../embeds/participantPanelEmbed";
import { refreshJoinMessage } from "../services/joinMessageService";
import { Sprint } from "../database/models/Sprint";
import { SprintParticipant } from "../database/models/SprintParticipant";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [sprintId, formatRaw] = args;
  const format = formatRaw as BookFormat;

  const title = interaction.fields.getTextInputValue("title").trim();
  const current = parseFormatValue(format, interaction.fields.getTextInputValue("current"));
  const total = parseFormatValuePositive(format, interaction.fields.getTextInputValue("total"));
  const goalRaw = interaction.fields.getTextInputValue("goal");
  const goalDelta = goalRaw ? parseFormatValuePositive(format, goalRaw) : null;

  if (current === null || total === null || (goalRaw && goalDelta === null)) {
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

  // Erneute Prüfung (Race Condition): der Sprint könnte zwischen Button-Klick
  // und Absenden des Modals in die Kulanzzeit gewechselt sein.
  const sprint = await Sprint.findById(sprintId);
  if (!sprint || sprint.status !== "active") {
    await interaction.reply({ content: Texts.end.sprintOver, ephemeral: true });
    return;
  }

  const input: NewBookInput = {
    title,
    format,
    current,
    total,
    goalDelta: goalDelta ?? undefined,
  };

  let participant;
  try {
    participant = await joinSprint(sprintId, interaction.user.id, interaction.guildId!, input);
  } catch (error: any) {
    // Doppelter Beitritt (z.B. durch Doppelklick oder abgelaufenes vorheriges
    // Interaction-Token) -> freundliche Meldung statt hartem Crash.
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
    content: Texts.join.welcome(title),
    embeds: [embed],
    components,
    ephemeral: true,
  });

  await refreshJoinMessage(interaction.client, sprintId);
}
