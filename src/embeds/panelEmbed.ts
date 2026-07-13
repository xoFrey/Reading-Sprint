import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Colors, CustomId } from "../config/constants";
import { Texts } from "../config/texts";

/**
 * Baut das permanente Panel-Embed inkl. der 4 Haupt-Buttons.
 * Wird von /reading-panel einmalig gepostet und danach nicht mehr verändert.
 */
export function buildPanelEmbed(): { embed: EmbedBuilder; components: ActionRowBuilder<ButtonBuilder>[] } {
  const embed = new EmbedBuilder()
    .setColor(Colors.primary)
    .setTitle(Texts.panel.title)
    .setDescription(Texts.panel.description);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(CustomId.PANEL_SCHEDULE)
      .setLabel("Schedule")
      .setEmoji("📅")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(CustomId.PANEL_START)
      .setLabel("Start")
      .setEmoji("▶️")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(CustomId.PANEL_END)
      .setLabel("End")
      .setEmoji("⏹️")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(CustomId.PANEL_LEADERBOARD)
      .setLabel("Leaderboard")
      .setEmoji("🏆")
      .setStyle(ButtonStyle.Secondary)
  );

  return { embed, components: [row] };
}
