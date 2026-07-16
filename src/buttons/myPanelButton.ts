import { ButtonInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { SprintParticipant } from "../database/models/SprintParticipant";
import { buildParticipantPanel } from "../embeds/participantPanelEmbed";

/**
 * Sitzt neben "Beitreten" auf der öffentlichen Sprint-Start-Nachricht.
 * Findet den eigenen Teilnehmer-Datensatz und zeigt das private Panel erneut
 * an - praktisch, falls jemand die ursprüngliche ephemeral Nachricht
 * versehentlich weggeklickt ("dismissed") hat und sonst nichts mehr tun könnte.
 */
export async function execute(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const { args } = parseCustomId(interaction.customId);
  const [sprintId] = args;

  const participant = await SprintParticipant.findOne({
    sprintId,
    userId: interaction.user.id,
    status: { $ne: "left" },
  });

  if (!participant) {
    await interaction.editReply({ content: Texts.join.notYetJoined });
    return;
  }

  const { embed, components } = buildParticipantPanel(participant);
  await interaction.editReply({ embeds: [embed], components });
}
