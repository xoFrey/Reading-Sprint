import { ModalSubmitInteraction, TextChannel } from "discord.js";
import { Texts } from "../config/texts";
import { parseGermanDateTime } from "../utils/parsing";
import { formatMinutes } from "../utils/format";
import { getRoleMention } from "../utils/guildConfig";
import { ScheduledSprint } from "../database/models/ScheduledSprint";
import { refreshPanel } from "../services/panelService";
import { hasOverlappingSprint } from "../services/overlapService";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const dateStr = interaction.fields.getTextInputValue("date");
  const startTimeStr = interaction.fields.getTextInputValue("startTime");
  const endTimeStr = interaction.fields.getTextInputValue("endTime");

  const scheduledStart = parseGermanDateTime(dateStr, startTimeStr);
  const scheduledEnd = parseGermanDateTime(dateStr, endTimeStr);

  if (!scheduledStart || !scheduledEnd) {
    await interaction.reply({ content: Texts.schedule.invalidDate, ephemeral: true });
    return;
  }

  // Dauer wird aus Start- und Endzeit berechnet, nicht mehr manuell eingegeben.
  const duration = Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / 60_000);
  if (duration <= 0) {
    await interaction.reply({ content: Texts.schedule.endBeforeStart, ephemeral: true });
    return;
  }

  if (scheduledStart.getTime() <= Date.now()) {
    await interaction.reply({ content: Texts.schedule.inPast, ephemeral: true });
    return;
  }

  const overlaps = await hasOverlappingSprint(interaction.guildId!, scheduledStart, duration);
  if (overlaps) {
    await interaction.reply({ content: Texts.schedule.overlap, ephemeral: true });
    return;
  }

  await ScheduledSprint.create({
    guildId: interaction.guildId,
    channelId: interaction.channelId!,
    scheduledStart,
    duration,
    createdBy: interaction.user.id,
  });

  const unixTimestamp = Math.floor(scheduledStart.getTime() / 1000).toString();
  await interaction.reply({
    content: Texts.schedule.success(unixTimestamp, formatMinutes(duration)),
    ephemeral: true,
  });

  // Öffentliche Ankündigung mit Rollen-Ping (falls LESESPRINTER_ROLE_ID
  // konfiguriert ist), da die obige Antwort nur für den Planenden sichtbar ist.
  const roleMention = getRoleMention();
  if (roleMention) {
    const channel = interaction.channel as TextChannel | null;
    await channel
      ?.send(
        `${roleMention} 📅 Neuer Sprint geplant für <t:${unixTimestamp}:F> (Dauer: ${formatMinutes(duration)}).`
      )
      .catch(() => undefined);
  }

  await refreshPanel(interaction.client, interaction.guildId!);
}
