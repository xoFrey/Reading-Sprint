import { ButtonInteraction, PermissionFlagsBits } from "discord.js";
import { Sprint } from "../database/models/Sprint";
import { endSprint } from "../services/sprintService";
import { buildSprintEndEmbed } from "../embeds/sprintEndEmbed";
import { Texts } from "../config/texts";

export async function execute(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: Texts.end.noAdmin, ephemeral: true });
    return;
  }

  const activeSprint = await Sprint.findOne({ guildId: interaction.guildId, status: "active" });
  if (!activeSprint) {
    await interaction.reply({ content: Texts.end.noActiveSprint, ephemeral: true });
    return;
  }

  await interaction.deferReply();

  const results = await endSprint(activeSprint.id);
  const embed = buildSprintEndEmbed(results);

  await interaction.editReply({ content: Texts.end.ended, embeds: [embed] });
}
