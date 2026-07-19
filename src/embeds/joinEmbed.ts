import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Colors, CustomId, buildCustomId } from "../config/constants";
import { Texts } from "../config/texts";

// Ein Eintrag für die Teilnehmerliste im öffentlichen Sprint-Embed.
export interface JoinEmbedParticipant {
  userId: string;
  bookTitle: string;
  startPage: number;
  paused: boolean;
}

export function buildJoinEmbed(
  sprintId: string,
  durationMinutes: number,
  endTime: Date,
  participants: JoinEmbedParticipant[] = []
): { embed: EmbedBuilder; components: ActionRowBuilder<ButtonBuilder>[] } {
  const endUnix = Math.floor(endTime.getTime() / 1000);

  const embed = new EmbedBuilder()
    .setColor(Colors.success)
    .setTitle("🏁 Lese-Sprint gestartet!")
    .setDescription(Texts.start.announcement(durationMinutes))
    .addFields({
      name: "Ende",
      // Absolute Uhrzeit UND relative Angabe nebeneinander (Punkt 1 aus der Anfrage).
      value: `<t:${endUnix}:t> Uhr (<t:${endUnix}:R>) · Dauer: ${durationMinutes} Min`,
    });

  if (participants.length > 0) {
    const lines = participants.map(
      (p) => `${p.paused ? "⏸️" : "📖"} <@${p.userId}> — ${p.bookTitle} (ab Seite ${p.startPage})`
    );
    embed.addFields({ name: `Teilnehmer (${participants.length})`, value: lines.join("\n") });
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
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

  return { embed, components: [row] };
}
