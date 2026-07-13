import { ModalSubmitInteraction } from "discord.js";
import { Texts } from "../config/texts";
import { parsePositiveInt } from "../utils/parsing";
import { startSprint } from "../services/sprintService";
import { buildJoinEmbed } from "../embeds/joinEmbed";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const durationStr = interaction.fields.getTextInputValue("duration");
  const duration = parsePositiveInt(durationStr);

  if (!duration) {
    await interaction.reply({ content: Texts.schedule.invalidDate, ephemeral: true });
    return;
  }

  const sprint = await startSprint(
    interaction.guildId!,
    interaction.channelId!,
    interaction.user.id,
    duration
  );

  const endTime = new Date(sprint.startTime.getTime() + duration * 60_000);
  const { embed, components } = buildJoinEmbed(sprint.id, duration, endTime);

  await interaction.reply({ embeds: [embed], components });

  // Automatisches Sprintende wird vom Scheduler-Job (jobs/scheduler.ts) übernommen,
  // der regelmäßig prüft, ob active Sprints ihre Endzeit erreicht haben.
}
