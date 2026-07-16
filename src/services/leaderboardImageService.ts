import { buildCardListImage, CardEntry } from "./cardImageService";

export interface LeaderboardImageEntry {
  rank: number;
  displayName: string;
  bookTitle: string;
  pagesRead: number;
  level: number;
  currentStreak: number;
  totalXP: number;
  currentLevelXP: number;
  xpForNextLevel: number;
  avatarUrl?: string;
}

/**
 * Baut das Leaderboard-Bild über die gemeinsame Karten-Engine (siehe
 * cardImageService.ts) - dieselbe visuelle Sprache wie das Sprint-Abschluss-Bild.
 */
export async function buildLeaderboardImage(entries: LeaderboardImageEntry[]): Promise<Buffer> {
  const cardEntries: CardEntry[] = entries.map((entry) => {
    const xpUntilNext = entry.xpForNextLevel - entry.currentLevelXP;

    return {
      rank: entry.rank,
      avatarUrl: entry.avatarUrl,
      boldLine: `#${entry.rank} - ${entry.displayName}`,
      detailLines: [
        entry.bookTitle,
        `${entry.pagesRead} Seiten`,
        `Level ${entry.level} — ${entry.currentLevelXP}/${entry.xpForNextLevel} XP (${xpUntilNext} bis Level ${entry.level + 1})`,
        `${entry.totalXP} XP insgesamt · 🔥 ${entry.currentStreak} Tage Streak`,
      ],
    };
  });

  return buildCardListImage({ title: "Leaderboard" }, cardEntries);
}
