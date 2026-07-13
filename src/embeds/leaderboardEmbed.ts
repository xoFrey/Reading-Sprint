import { EmbedBuilder } from "discord.js";
import { Colors } from "../config/constants";
import { Texts } from "../config/texts";
import { IUser } from "../database/models/User";
import { calculateLevelProgress } from "../xp/levelCurve";

export function buildLeaderboardEmbed(users: IUser[]): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(Colors.primary).setTitle(Texts.leaderboard.title);

  if (users.length === 0) {
    embed.setDescription(Texts.leaderboard.noData);
    return embed;
  }

  // Nutzer sind bereits nach XP sortiert (siehe Aufrufer), Rang = Position in der Liste.
  users.forEach((user, index) => {
    const progress = calculateLevelProgress(user.xp);
    embed.addFields({
      name: `#${index + 1} — <@${user.discordId}>`,
      value: Texts.leaderboard.entry(
        index + 1,
        progress.level,
        progress.currentLevelXP,
        progress.xpForNextLevel,
        user.xp
      ),
    });
  });

  return embed;
}
