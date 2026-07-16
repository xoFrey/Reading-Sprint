import { ButtonInteraction, PermissionFlagsBits, AttachmentBuilder } from "discord.js";
import { Sprint } from "../database/models/Sprint";
import { finalizeSprint } from "../services/sprintService";
import { buildSprintEndImage } from "../services/sprintEndImageService";
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

  if (results.length === 0) {
    await interaction.editReply({ content: `${Texts.end.ended}\n${Texts.sprintEnd.noParticipants}` });
    return;
  }

  const imageBuffer = await buildSprintEndImage(interaction.client, interaction.guildId!, results);
  const attachment = new AttachmentBuilder(imageBuffer, { name: "sprint-ende.png" });

  await interaction.editReply({ content: Texts.end.ended, files: [attachment] });
}
