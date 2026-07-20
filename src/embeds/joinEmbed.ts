import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Colors, CustomId, buildCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { formatMinutes } from "../utils/format";

// Ein Eintrag für die Teilnehmerliste im öffentlichen Sprint-Embed.
export interface JoinEmbedParticipant {
  userId: string;
  bookTitle: string;
  startPage: number;
  paused: boolean;
}

export const PARTICIPANTS_PAGE_SIZE = 10;

export function getTotalParticipantPages(participantCount: number): number {
  return Math.max(1, Math.ceil(participantCount / PARTICIPANTS_PAGE_SIZE));
}

export function buildJoinEmbed(
  sprintId: string,
  durationMinutes: number,
  endTime: Date,
  participants: JoinEmbedParticipant[] = [],
  page = 1
): { embed: EmbedBuilder; components: ActionRowBuilder<ButtonBuilder>[] } {
  const endUnix = Math.floor(endTime.getTime() / 1000);
  const totalPages = getTotalParticipantPages(participants.length);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pageParticipants = participants.slice(
    (safePage - 1) * PARTICIPANTS_PAGE_SIZE,
    safePage * PARTICIPANTS_PAGE_SIZE
  );

  const embed = new EmbedBuilder()
    .setColor(Colors.success)
    .setTitle("🏁 Lese-Sprint gestartet!")
    .setDescription(Texts.start.announcement(formatMinutes(durationMinutes)))
    .addFields({
      name: "Ende",
      // Absolute Uhrzeit UND relative Angabe nebeneinander.
      value: `<t:${endUnix}:t> Uhr (<t:${endUnix}:R>) · Dauer: ${formatMinutes(durationMinutes)}`,
    });

  if (participants.length > 0) {
    const lines = pageParticipants.map(
      (p) => `${p.paused ? "⏸️" : "📖"} <@${p.userId}> — ${p.bookTitle} (ab Seite ${p.startPage})`
    );
    const fieldName =
      totalPages > 1
        ? `Teilnehmer (${participants.length}) — Seite ${safePage}/${totalPages}`
        : `Teilnehmer (${participants.length})`;
    embed.addFields({ name: fieldName, value: lines.join("\n") });
  }

  const joinRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(buildCustomId(CustomId.SPRINT_JOIN, sprintId))
      .setLabel("Beitreten")
      .setEmoji("🙋")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(buildCustomId(CustomId.SPRINT_MY_PANEL, sprintId))
      .setLabel(Texts.join.myPanelButtonLabel)
      .setEmoji("📋")
      .setStyle(ButtonStyle.Secondary)
  );

  const components = [joinRow];

  if (totalPages > 1) {
    const pageRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId(CustomId.JOIN_PARTICIPANTS_PAGE, sprintId, String(safePage - 1)))
        .setLabel("◀ Zurück")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(safePage <= 1),
      new ButtonBuilder()
        .setCustomId(buildCustomId(CustomId.JOIN_PARTICIPANTS_PAGE, sprintId, String(safePage + 1)))
        .setLabel("Weiter ▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(safePage >= totalPages)
    );
    components.push(pageRow);
  }

  return { embed, components };
}
