import { ButtonInteraction, AttachmentBuilder } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { Sprint } from "../database/models/Sprint";
import { ParticipantResult } from "../services/sprintService";
import {
  buildSprintEndImage,
  buildResultsPaginationRow,
  getTotalResultPages,
} from "../services/sprintEndImageService";

export async function execute(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferUpdate();

  const { args } = parseCustomId(interaction.customId);
  const [sprintId, pageStr] = args;
  const page = Number.parseInt(pageStr, 10);

  const sprint = await Sprint.findById(sprintId);
  if (!sprint?.resultsSnapshot) {
    await interaction.followUp({ content: Texts.errors.generic, ephemeral: true });
    return;
  }

  const results = sprint.resultsSnapshot as unknown as ParticipantResult[];
  const totalPages = getTotalResultPages(results.length);
  const safePage = Math.min(Math.max(page, 1), totalPages);

  const imageBuffer = await buildSprintEndImage(
    interaction.client,
    sprint.guildId,
    results,
    sprint.duration,
    safePage
  );
  const attachment = new AttachmentBuilder(imageBuffer, { name: "sprint-ende.png" });

  const row = buildResultsPaginationRow(sprintId, safePage, totalPages);

  await interaction.editReply({
    files: [attachment],
    components: row ? [row] : [],
  });
}
