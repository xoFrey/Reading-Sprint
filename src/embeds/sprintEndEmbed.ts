import { EmbedBuilder } from "discord.js";
import { Colors } from "../config/constants";
import { Texts } from "../config/texts";
import { ParticipantResult } from "../services/sprintService";
import { formatMinutes } from "../utils/format";

export function buildSprintEndEmbed(results: ParticipantResult[]): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(Colors.primary).setTitle(Texts.sprintEnd.title);

  if (results.length === 0) {
    embed.setDescription(Texts.sprintEnd.noParticipants);
    return embed;
  }

  const medals = ["🥇", "🥈", "🥉"];

  for (const result of results) {
    const medal = medals[result.placement - 1] ?? `#${result.placement}`;
    const bookLines = result.books
      .map((book) => `${book.title}: ${book.currentPage - book.startPage} Seiten`)
      .join("\n");

    const goalStatus = result.goalReached ? Texts.sprintEnd.goalReached : Texts.sprintEnd.goalMissed;
    const levelUpLine = result.leveledUp ? `\n${Texts.sprintEnd.levelUp(result.newLevel)}` : "";
    const leftEarlyLine = result.leftEarly ? `\n${Texts.sprintEnd.leftEarly}` : "";

    const xpUntilNext = result.xpForNextLevel - result.currentLevelXP;
    const statsLine =
      `⏱️ ${formatMinutes(result.minutesInSprint)} im Sprint · +${result.xpEarned} XP · ` +
      `${xpUntilNext} XP bis Level ${result.newLevel + 1}`;

    embed.addFields({
      name: `${medal} Platz ${result.placement} — ${result.totalPagesRead} Seiten gesamt`,
      value: `<@${result.userId}>\n${bookLines}\n${goalStatus} · ${statsLine}${levelUpLine}${leftEarlyLine}`,
    });
  }

  return embed;
}
