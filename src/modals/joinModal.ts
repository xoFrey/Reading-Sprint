import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { parsePositiveInt, parseNonNegativeInt } from "../utils/parsing";
import { joinSprint } from "../services/sprintService";
import { buildParticipantPanel } from "../embeds/participantPanelEmbed";
import { refreshJoinMessage } from "../services/joinMessageService";
import { Sprint } from "../database/models/Sprint";
import { SprintParticipant } from "../database/models/SprintParticipant";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [sprintId] = args;

  const title = interaction.fields.getTextInputValue("title").trim();
  const currentPage = parseNonNegativeInt(interaction.fields.getTextInputValue("currentPage"));
  const totalPages = parsePositiveInt(interaction.fields.getTextInputValue("totalPages"));
  const goalPagesRaw = interaction.fields.getTextInputValue("goalPage");
  const goalPagesToRead = goalPagesRaw ? parsePositiveInt(goalPagesRaw) : null;

  if (currentPage === null || totalPages === null || (goalPagesRaw && goalPagesToRead === null)) {
    await interaction.reply({ content: Texts.errors.generic, ephemeral: true });
    return;
  }

  // Nutzer geben ein, WIE VIELE Seiten sie lesen wollen (nicht die absolute
  // Zielseite) - intern rechnen wir das auf die absolute Seite um, damit der
  // Rest des Codes (goalReached-Prüfung etc.) unverändert bleibt.
  const goalPage = goalPagesToRead ? currentPage + goalPagesToRead : undefined;

  // Erneute Prüfung (Race Condition): der Sprint könnte zwischen Button-Klick
  // und Absenden des Modals in die Kulanzzeit gewechselt sein.
  const sprint = await Sprint.findById(sprintId);
  if (!sprint || sprint.status !== "active") {
    await interaction.reply({ content: Texts.end.sprintOver, ephemeral: true });
    return;
  }

  let participant;
  try {
    participant = await joinSprint(
      sprintId,
      interaction.user.id,
      interaction.guildId!,
      title,
      currentPage,
      totalPages,
      goalPage
    );
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
