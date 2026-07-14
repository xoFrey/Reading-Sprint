import { ButtonInteraction, PermissionFlagsBits } from "discord.js";
import { Sprint } from "../database/models/Sprint";
import { finalizeSprint } from "../services/sprintService";
import { buildSprintEndEmbed } from "../embeds/sprintEndEmbed";
import { Texts } from "../config/texts";

export async function execute(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: Texts.end.noAdmin, ephemeral: true });
    return;
  }

  // Sofort bestätigen, bevor die (potenziell langsamere) DB-Abfrage läuft.
  await interaction.deferReply();

  // Admin-Abbruch überspringt bewusst die Kulanzzeit (Grace Period) - dafür
  // ist der Button ja da: sofort beenden, falls etwas schiefgelaufen ist.
  const activeSprint = await Sprint.findOne({
    guildId: interaction.guildId,
    status: { $in: ["active", "grace"] },
  });
  if (!activeSprint) {
    await interaction.editReply({ content: Texts.end.noActiveSprint });
    return;
  }

  const results = await finalizeSprint(activeSprint.id);
  const embed = buildSprintEndEmbed(results);

  await interaction.editReply({ content: Texts.end.ended, embeds: [embed] });
}
