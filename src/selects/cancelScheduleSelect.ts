import { StringSelectMenuInteraction, PermissionFlagsBits } from "discord.js";
import { Texts } from "../config/texts";
import { ScheduledSprint } from "../database/models/ScheduledSprint";
import { refreshPanel } from "../services/panelService";

export async function execute(interaction: StringSelectMenuInteraction): Promise<void> {
  const scheduledSprintId = interaction.values[0];

  const scheduled = await ScheduledSprint.findOne({ _id: scheduledSprintId, status: "scheduled" });
  if (!scheduled) {
    await interaction.update({ content: Texts.scheduleCancel.notFound, components: [] });
    return;
  }

  const isCreator = scheduled.createdBy === interaction.user.id;
  const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;

  if (!isCreator && !isAdmin) {
    await interaction.update({ content: Texts.scheduleCancel.noPermission, components: [] });
    return;
  }

  scheduled.status = "cancelled";
  await scheduled.save();

  await interaction.update({ content: Texts.scheduleCancel.success, components: [] });

  await refreshPanel(interaction.client, interaction.guildId!);
}
