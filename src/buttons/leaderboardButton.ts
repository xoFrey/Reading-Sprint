import { ButtonInteraction } from "discord.js";
import { User } from "../database/models/User";
import { buildLeaderboardEmbed } from "../embeds/leaderboardEmbed";

const LEADERBOARD_LIMIT = 10;

export async function execute(interaction: ButtonInteraction): Promise<void> {
  const topUsers = await User.find({ guildId: interaction.guildId })
    .sort({ xp: -1 })
    .limit(LEADERBOARD_LIMIT);

  const embed = buildLeaderboardEmbed(topUsers);
  await interaction.reply({ embeds: [embed], ephemeral: true });
}
