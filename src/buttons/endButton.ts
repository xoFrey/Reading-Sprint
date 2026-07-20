import { ButtonInteraction, PermissionFlagsBits, AttachmentBuilder, TextChannel } from "discord.js";
import { Sprint } from "../database/models/Sprint";
import { finalizeSprint } from "../services/sprintService";
import {
  buildSprintEndImage,
  buildResultsPaginationRow,
  getTotalResultPages,
} from "../services/sprintEndImageService";
import { getResultsChannelId } from "../utils/guildConfig";
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

  const totalPages = getTotalResultPages(results.length);
  const imageBuffer = await buildSprintEndImage(
    interaction.client,
    interaction.guildId!,
    results,
    activeSprint.duration,
    1
  );
  const attachment = new AttachmentBuilder(imageBuffer, { name: "sprint-ende.png" });
  const row = buildResultsPaginationRow(activeSprint.id, 1, totalPages);

  // Optional in einen separaten Ergebnis-Kanal posten (RESULTS_CHANNEL_ID),
  // sonst im selben Kanal wie der Sprint. Die Ergebnisse werden NICHT vom
  // Cleanup-Job gelöscht (siehe database/models/Sprint.ts).
  const resultsChannelId = getResultsChannelId();
  const resultsChannel = resultsChannelId
    ? ((await interaction.client.channels.fetch(resultsChannelId).catch(() => null)) as TextChannel | null)
    : null;

  let resultsMessageId: string;
  if (resultsChannel) {
    const sentMessage = await resultsChannel.send({ files: [attachment], components: row ? [row] : [] });
    resultsMessageId = sentMessage.id;
    await interaction.editReply({ content: `${Texts.end.ended}\n📊 Ergebnisse: ${resultsChannel}` });
  } else {
    const message = await interaction.editReply({
      content: Texts.end.ended,
      files: [attachment],
      components: row ? [row] : [],
    });
    resultsMessageId = message.id;
  }

  await Sprint.findByIdAndUpdate(activeSprint.id, {
    resultsMessageId,
    resultsChannelId: resultsChannel?.id ?? activeSprint.channelId,
    resultsSnapshot: results,
  });
}
