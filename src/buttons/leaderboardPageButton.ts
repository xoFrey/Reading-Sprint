import { ButtonInteraction, AttachmentBuilder } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import {
  buildLeaderboardImage,
  buildLeaderboardEntries,
  buildLeaderboardPaginationRow,
  getTotalLeaderboardPages,
} from "../services/leaderboardImageService";

export async function execute(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferUpdate();

  const { args } = parseCustomId(interaction.customId);
  const [pageStr] = args;
  const requestedPage = Number.parseInt(pageStr, 10);

  const totalPages = await getTotalLeaderboardPages(interaction.guildId!);
  const safePage = Math.min(Math.max(requestedPage, 1), totalPages);

  const entries = await buildLeaderboardEntries(interaction.client, interaction.guildId!, safePage);

  if (entries.length === 0) {
    await interaction.followUp({ content: Texts.leaderboard.noData, ephemeral: true });
    return;
  }

  const imageBuffer = await buildLeaderboardImage(entries, safePage, totalPages);
  const attachment = new AttachmentBuilder(imageBuffer, { name: "leaderboard.png" });
  const row = buildLeaderboardPaginationRow(safePage, totalPages);

  await interaction.editReply({ files: [attachment], components: row ? [row] : [] });
}
