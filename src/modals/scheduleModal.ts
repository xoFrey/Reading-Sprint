import { ModalSubmitInteraction } from "discord.js";
import { Texts } from "../config/texts";
import { parseGermanDateTime, parsePositiveInt } from "../utils/parsing";
import { ScheduledSprint } from "../database/models/ScheduledSprint";
import { refreshPanel } from "../services/panelService";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const dateStr = interaction.fields.getTextInputValue("date");
  const timeStr = interaction.fields.getTextInputValue("time");
  const durationStr = interaction.fields.getTextInputValue("duration");

  const scheduledStart = parseGermanDateTime(dateStr, timeStr);
  const duration = parsePositiveInt(durationStr);

  if (!scheduledStart || !duration) {
    await interaction.reply({ content: Texts.schedule.invalidDate, ephemeral: true });
    return;
  }

  if (scheduledStart.getTime() <= Date.now()) {
    await interaction.reply({ content: Texts.schedule.inPast, ephemeral: true });
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
  await interaction.reply({ content: Texts.schedule.success(unixTimestamp), ephemeral: true });

  await refreshPanel(interaction.client, interaction.guildId!);
}
