import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { buildPanelEmbed } from "../embeds/panelEmbed";
import { Guild } from "../database/models/Guild";
import { getUpcomingSprints } from "../services/panelService";

export const data = new SlashCommandBuilder()
  .setName("reading-panel")
  .setDescription("Postet das permanente Lese-Sprint-Panel in diesem Kanal.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  // Bereits geplante Sprints (z.B. von vor einem Bot-Neustart) müssen direkt
  // beim ersten Posten angezeigt werden, nicht erst bei der nächsten Planung.
  const upcomingSprints = await getUpcomingSprints(interaction.guildId!);
  const { embed, components } = buildPanelEmbed(upcomingSprints);
  const reply = await interaction.editReply({ embeds: [embed], components });

  // Speichern, WO das Panel liegt, damit panelService.refreshPanel() es später
  // (z.B. beim Planen eines Sprints) automatisch aktualisieren kann.
  await Guild.findOneAndUpdate(
    { guildId: interaction.guildId },
    { panelChannelId: interaction.channelId, panelMessageId: reply.id },
    { upsert: true }
  );
}
