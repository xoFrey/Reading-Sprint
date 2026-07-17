import { ButtonInteraction, PermissionFlagsBits } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { ScheduledSprint } from "../database/models/ScheduledSprint";
import { refreshPanel } from "../services/panelService";

/**
 * Löscht einen geplanten Sprint - genauer: markiert ihn als "cancelled",
 * damit der Scheduler-Job ihn nicht mehr triggert und er aus der Panel-Liste
 * verschwindet (panelService.getUpcomingSprints filtert auf status "scheduled").
 * Das Dokument bleibt zu Nachvollziehbarkeit in der DB erhalten, statt es
 * hart zu löschen.
 */
export async function execute(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const { args } = parseCustomId(interaction.customId);
  const [scheduledSprintId] = args;

  const scheduled = await ScheduledSprint.findOne({ _id: scheduledSprintId, status: "scheduled" });
  if (!scheduled) {
    await interaction.editReply({ content: Texts.scheduleCancel.notFound });
    return;
  }

  const isCreator = scheduled.createdBy === interaction.user.id;
  const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;

  if (!isCreator && !isAdmin) {
    await interaction.editReply({ content: Texts.scheduleCancel.noPermission });
    return;
  }

  scheduled.status = "cancelled";
  await scheduled.save();

  await interaction.editReply({ content: Texts.scheduleCancel.success });

  await refreshPanel(interaction.client, interaction.guildId!);
}
