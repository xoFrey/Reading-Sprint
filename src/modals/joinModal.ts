import { ModalSubmitInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { parsePositiveInt } from "../utils/parsing";
import { joinSprint } from "../services/sprintService";
import { buildParticipantPanel } from "../embeds/participantPanelEmbed";
import { refreshJoinMessage } from "../services/joinMessageService";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [sprintId] = args;

  const title = interaction.fields.getTextInputValue("title").trim();
  const currentPage = parsePositiveInt(interaction.fields.getTextInputValue("currentPage"));
  const totalPages = parsePositiveInt(interaction.fields.getTextInputValue("totalPages"));
  const goalPageRaw = interaction.fields.getTextInputValue("goalPage");
  const goalPage = goalPageRaw ? parsePositiveInt(goalPageRaw) ?? undefined : undefined;

  if (currentPage === null || totalPages === null) {
    await interaction.reply({ content: Texts.errors.generic, ephemeral: true });
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
      await interaction.reply({ content: Texts.join.alreadyJoined, ephemeral: true });
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
