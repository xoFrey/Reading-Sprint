import { EmbedBuilder } from "discord.js";
import { Colors } from "../config/constants";
import { Texts } from "../config/texts";
import { ParticipantResult } from "../services/sprintService";

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

    embed.addFields({
      name: `${medal} <@${result.userId}> — ${result.totalPagesRead} Seiten gesamt`,
      value: `${bookLines}\n${goalStatus} · +${result.xpEarned} XP${levelUpLine}`,
    });
  }

  return embed;
}
