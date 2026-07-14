import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Colors, CustomId, buildCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { IScheduledSprint } from "../database/models/ScheduledSprint";

/**
 * Baut das permanente Panel-Embed inkl. der 4 Haupt-Buttons sowie - falls
 * Sprints geplant sind - einer zweiten Button-Reihe zum Vorab-Anmelden
 * (je ein Button pro geplantem Sprint, daher können Nutzer sich für mehrere
 * gleichzeitig eintragen).
 * Wird von /reading-panel initial gepostet und danach von panelService.refreshPanel()
 * bei jeder Änderung an geplanten Sprints neu aufgebaut (per message.edit).
 *
 * @param upcomingSprints geplante, noch nicht gestartete Sprints (sortiert nach Startzeit)
 */
export function buildPanelEmbed(
  upcomingSprints: IScheduledSprint[] = []
): { embed: EmbedBuilder; components: ActionRowBuilder<ButtonBuilder>[] } {
  const embed = new EmbedBuilder()
    .setColor(Colors.primary)
    .setTitle(Texts.panel.title)
    .setDescription(Texts.panel.description);

  if (upcomingSprints.length > 0) {
    const lines = upcomingSprints.map((sprint) => {
      const unixTimestamp = Math.floor(sprint.scheduledStart.getTime() / 1000);
      const registeredCount = sprint.registeredUsers.length;
      return (
        `<t:${unixTimestamp}:F> (<t:${unixTimestamp}:R>) — ${sprint.duration} Minuten` +
        (registeredCount > 0 ? ` · 🔔 ${registeredCount} angemeldet` : "")
      );
    });

    embed.addFields({ name: "📅 Geplante Sprints", value: lines.join("\n") });
  }

  const mainRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
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

  const components = [mainRow];

  // Ein Button pro geplantem Sprint -> Klick meldet an/ab (Toggle), unabhängig
  // von den Buttons der anderen Sprints. So kann man sich für mehrere eintragen.
  if (upcomingSprints.length > 0) {
    const registerRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      upcomingSprints.map((sprint) => {
        const timeLabel = sprint.scheduledStart.toLocaleString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

        return new ButtonBuilder()
          .setCustomId(buildCustomId(CustomId.SCHEDULE_REGISTER, sprint.id))
          .setLabel(timeLabel)
          .setEmoji("🔔")
          .setStyle(ButtonStyle.Secondary);
      })
    );

    components.push(registerRow);
  }

  return { embed, components };
}
