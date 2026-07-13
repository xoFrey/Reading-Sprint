import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { buildPanelEmbed } from "../embeds/panelEmbed";

export const data = new SlashCommandBuilder()
  .setName("reading-panel")
  .setDescription("Postet das permanente Lese-Sprint-Panel in diesem Kanal.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const { embed, components } = buildPanelEmbed();
  await interaction.reply({ embeds: [embed], components });
}
