import { Client, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { buildCardListImage, CardEntry } from "./cardImageService";
import { User } from "../database/models/User";
import { Book } from "../database/models/Book";
import { calculateLevelProgress } from "../xp/levelCurve";
import { CustomId, buildCustomId } from "../config/constants";

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

export const LEADERBOARD_PAGE_SIZE = 10;

export async function getTotalLeaderboardPages(guildId: string): Promise<number> {
  const count = await User.countDocuments({ guildId });
  return Math.max(1, Math.ceil(count / LEADERBOARD_PAGE_SIZE));
}

/**
 * Lädt EINE Seite des serverweiten Leaderboards (alle Mitglieder, sortiert
 * nach Gesamt-XP absteigend) und baut daraus die Anzeige-Einträge inkl.
 * Rang, Avatar und aktuellem Buch. Wird sowohl beim ersten Öffnen als auch
 * beim Blättern (leaderboardPageButton.ts) verwendet.
 */
export async function buildLeaderboardEntries(
  client: Client,
  guildId: string,
  page: number
): Promise<LeaderboardImageEntry[]> {
  const skip = (page - 1) * LEADERBOARD_PAGE_SIZE;

  const users = await User.find({ guildId })
    .sort({ xp: -1 })
    .skip(skip)
    .limit(LEADERBOARD_PAGE_SIZE);

  const guild = await client.guilds.fetch(guildId).catch(() => null);

  const entries: LeaderboardImageEntry[] = [];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];

    const member = await guild?.members.fetch(user.discordId).catch(() => null);
    const discordUser = member?.user ?? (await client.users.fetch(user.discordId).catch(() => null));

    const displayName = member?.displayName ?? discordUser?.username ?? "Unbekannt";
    const avatarUrl = discordUser?.displayAvatarURL({ extension: "png", size: 128 });

    const currentBook = await Book.findOne({ userId: user.discordId, guildId: user.guildId }).sort({
      updatedAt: -1,
    });

    const progress = calculateLevelProgress(user.xp);

    entries.push({
      rank: skip + i + 1,
      displayName,
      bookTitle: currentBook?.title ?? "—",
      pagesRead: user.totalPagesRead,
      level: progress.level,
      currentStreak: user.currentStreak,
      totalXP: user.xp,
      currentLevelXP: progress.currentLevelXP,
      xpForNextLevel: progress.xpForNextLevel,
      avatarUrl,
    });
  }

  return entries;
}

/**
 * Baut das Leaderboard-Bild über die gemeinsame Karten-Engine (siehe
 * cardImageService.ts) - dieselbe visuelle Sprache wie das Sprint-Abschluss-Bild.
 */
export async function buildLeaderboardImage(
  entries: LeaderboardImageEntry[],
  page: number,
  totalPages: number
): Promise<Buffer> {
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
        `${entry.totalXP} XP insgesamt`,
        `Streak: ${entry.currentStreak} Tage`,
      ],
    };
  });

  const subtitle = totalPages > 1 ? `Seite ${page}/${totalPages}` : undefined;

  return buildCardListImage({ title: "Leaderboard", subtitle }, cardEntries);
}

/**
 * Baut die Zurück/Weiter-Buttons fürs Blättern durch das Leaderboard.
 * Gibt null zurück, wenn nur eine Seite existiert (keine Buttons nötig).
 */
export function buildLeaderboardPaginationRow(
  page: number,
  totalPages: number
): ActionRowBuilder<ButtonBuilder> | null {
  if (totalPages <= 1) return null;

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(buildCustomId(CustomId.LEADERBOARD_PAGE, String(page - 1)))
      .setLabel("◀ Zurück")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(buildCustomId(CustomId.LEADERBOARD_PAGE, String(page + 1)))
      .setLabel("Weiter ▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
  );
}
