import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { parsePositiveInt } from "../utils/parsing";
import { switchBook } from "../services/sprintService";
import { buildParticipantPanel } from "../embeds/participantPanelEmbed";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [participantId] = args;

  const title = interaction.fields.getTextInputValue("title").trim();
  const currentPage = parsePositiveInt(interaction.fields.getTextInputValue("currentPage"));
  const totalPages = parsePositiveInt(interaction.fields.getTextInputValue("totalPages"));
  const goalPageRaw = interaction.fields.getTextInputValue("goalPage");
  const goalPage = goalPageRaw ? parsePositiveInt(goalPageRaw) ?? undefined : undefined;

  if (currentPage === null || totalPages === null) {
    await interaction.reply({ content: Texts.errors.generic, ephemeral: true });
    return;
  }

  const participant = await switchBook(
    participantId,
    interaction.user.id,
    interaction.guildId!,
    title,
    currentPage,
    totalPages,
    goalPage
  );

  if (!participant) {
    await interaction.reply({ content: Texts.errors.notInSprint, ephemeral: true });
    return;
  }

  const { embed, components } = buildParticipantPanel(participant);

  await interaction.reply({
    content: Texts.participant.switchBookSuccess(title),
    embeds: [embed],
    components,
    ephemeral: true,
  });
}
