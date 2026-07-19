import { Client } from "discord.js";
import { ParticipantResult } from "./sprintService";
import { buildCardListImage, CardEntry } from "./cardImageService";
import { formatMinutes } from "../utils/format";
import { Texts } from "../config/texts";

/**
 * Baut das Sprint-Abschluss-Bild über dieselbe Karten-Engine wie das
 * Leaderboard (siehe cardImageService.ts) - bewusst derselbe visuelle Stil,
 * inklusive Avatar-Bildern statt reiner Rangzahlen.
 *
 * Nimmt den Client statt einer Interaction entgegen, da dieser sowohl vom
 * manuellen Admin-Abbruch (endButton.ts) als auch vom automatischen
 * Scheduler (jobs/scheduler.ts) aufgerufen wird.
 */
export async function buildSprintEndImage(
  client: Client,
  guildId: string,
  results: ParticipantResult[],
  sprintDurationMinutes: number,
): Promise<Buffer> {
  const guild = await client.guilds.fetch(guildId).catch(() => null);

  const entries: CardEntry[] = [];

  for (const result of results) {
    const member = await guild?.members.fetch(result.userId).catch(() => null);
    const discordUser =
      member?.user ??
      (await client.users.fetch(result.userId).catch(() => null));

    const displayName =
      member?.displayName ?? discordUser?.username ?? "Unbekannt";
    const avatarUrl = discordUser?.displayAvatarURL({
      extension: "png",
      size: 128,
    });

    const bookLines = result.books.map(
      (book) => `${book.title}: ${book.currentPage - book.startPage} Seiten`,
    );

    const xpUntilNext = result.xpForNextLevel - result.currentLevelXP;
    const goalStatus = result.goalReached
      ? Texts.sprintEnd.goalReached
      : Texts.sprintEnd.goalMissed;

    const detailLines: string[] = [
      ...bookLines,
      `${formatMinutes(result.minutesInSprint)}`,
      `+${result.xpEarned} XP`,
      `${xpUntilNext} XP bis Level ${result.newLevel + 1}`,
      goalStatus,
    ];
    if (result.leveledUp)
      detailLines.push(Texts.sprintEnd.levelUp(result.newLevel));
    if (result.leftEarly) detailLines.push(Texts.sprintEnd.leftEarly);

    entries.push({
      rank: result.placement,
      avatarUrl,
      boldLine: `#${result.placement} - ${displayName}`,
      detailLines,
    });
  }

  return buildCardListImage(
    { title: "Sprint beendet!", subtitle: `Geplante Dauer: ${formatMinutes(sprintDurationMinutes)}` },
    entries
  );
}
