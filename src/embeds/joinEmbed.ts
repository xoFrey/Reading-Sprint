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

// Discord erlaubt maximal 1024 Zeichen pro Embed-Feld-Wert. Bei vielen
// Teilnehmern reicht ein einzelnes Feld nicht mehr aus - diese Funktion
// verteilt die Zeilen auf mehrere Felder, ohne eine Zeile mittendrin abzuschneiden.
const MAX_FIELD_LENGTH = 1024;
// Grobe Obergrenze an Feldern für die Teilnehmerliste, damit das Embed
// insgesamt nicht das Gesamtlimit von 25 Feldern / 6000 Zeichen sprengt.
const MAX_PARTICIPANT_FIELDS = 15;

function chunkLines(lines: string[], maxLength: number): string[] {
  const chunks: string[] = [];
  let current = "";

  for (const line of lines) {
    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length > maxLength) {
      if (current) chunks.push(current);
      current = line;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);

  return chunks;
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
    let chunks = chunkLines(lines, MAX_FIELD_LENGTH);

    // Absicherung nach oben: sollte es je so viele Teilnehmer geben, dass
    // selbst das Feld-Limit gesprengt würde, wird gekürzt statt zu crashen.
    if (chunks.length > MAX_PARTICIPANT_FIELDS) {
      chunks = chunks.slice(0, MAX_PARTICIPANT_FIELDS);
      chunks[chunks.length - 1] += "\n… und weitere";
    }

    chunks.forEach((chunk, index) => {
      const name =
        chunks.length > 1
          ? `Teilnehmer (${participants.length}) — Teil ${index + 1}/${chunks.length}`
          : `Teilnehmer (${participants.length})`;
      embed.addFields({ name, value: chunk });
    });
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
