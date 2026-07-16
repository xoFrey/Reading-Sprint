import { ButtonInteraction, AttachmentBuilder } from "discord.js";
import { User } from "../database/models/User";
import { Book } from "../database/models/Book";
import { Texts } from "../config/texts";
import { calculateLevelProgress } from "../xp/levelCurve";
import {
  buildLeaderboardImage,
  LeaderboardImageEntry,
} from "../services/leaderboardImageService";

const LEADERBOARD_LIMIT = 5;

export async function execute(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const topUsers = await User.find({ guildId: interaction.guildId })
    .sort({ xp: -1 })
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
    const avatarUrl = discordUser?.displayAvatarURL({ extension: "png", size: 128 });

    const currentBook = await Book.findOne({ userId: user.discordId, guildId: user.guildId }).sort({
      updatedAt: -1,
    });

    const progress = calculateLevelProgress(user.xp);

    entries.push({
      rank: i + 1,
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

  const imageBuffer = await buildLeaderboardImage(entries);
  const attachment = new AttachmentBuilder(imageBuffer, { name: "leaderboard.png" });

  await interaction.editReply({ files: [attachment] });
}
