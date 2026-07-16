import { ButtonInteraction, AttachmentBuilder } from "discord.js";
import { User } from "../database/models/User";
import { Book } from "../database/models/Book";
import { Texts } from "../config/texts";
import {
  buildLeaderboardImage,
  LeaderboardImageEntry,
} from "../services/leaderboardImageService";

const LEADERBOARD_LIMIT = 5;

/**
 * Zeigt das Leaderboard als generiertes Bild (siehe leaderboardImageService.ts),
 * sortiert nach Gesamt-Lesezeit. Für jeden Eintrag werden zusätzlich geladen:
 * - das aktuell gelesene Buch (jüngstes Update in der Bibliothek)
 * - Level & Streak (direkt vom User-Dokument)
 * - der Discord-Avatar (für den Kreis im Bild)
 *
 * Willst du noch mehr Infos anzeigen (z.B. totalBooksFinished): einfach hier
 * beim Bauen von "entries" ein weiteres Feld ergänzen UND es im
 * LeaderboardImageEntry-Interface + buildLeaderboardImage() eintragen.
 */
export async function execute(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const topUsers = await User.find({ guildId: interaction.guildId })
    .sort({ totalMinutesRead: -1 })
    .limit(LEADERBOARD_LIMIT);

  if (topUsers.length === 0) {
    await interaction.editReply({ content: Texts.leaderboard.noData });
    return;
  }

  const entries: LeaderboardImageEntry[] = [];

  for (let i = 0; i < topUsers.length; i++) {
    const user = topUsers[i];

    const member = await interaction.guild?.members.fetch(user.discordId).catch(() => null);
    const discordUser = member?.user ?? (await interaction.client.users.fetch(user.discordId).catch(() => null));

    const displayName = member?.displayName ?? discordUser?.username ?? "Unbekannt";
    // Discord-Avatar als PNG, 128px reicht für die Kreisgröße im Bild völlig.
    const avatarUrl = discordUser?.displayAvatarURL({ extension: "png", size: 128 });

    const currentBook = await Book.findOne({ userId: user.discordId, guildId: user.guildId }).sort({
      updatedAt: -1,
    });

    entries.push({
      rank: i + 1,
      displayName,
      bookTitle: currentBook?.title ?? "—",
      pagesRead: user.totalPagesRead,
      minutesRead: user.totalMinutesRead,
      level: user.level,
      currentStreak: user.currentStreak,
      avatarUrl,
    });
  }

  const imageBuffer = await buildLeaderboardImage(entries);
  const attachment = new AttachmentBuilder(imageBuffer, { name: "leaderboard.png" });

  await interaction.editReply({ files: [attachment] });
}
