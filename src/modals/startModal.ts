import { ModalSubmitInteraction } from "discord.js";
import { Texts } from "../config/texts";
import { parsePositiveInt } from "../utils/parsing";
import { Sprint } from "../database/models/Sprint";
import { startSprint } from "../services/sprintService";
import { buildJoinEmbed } from "../embeds/joinEmbed";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const durationStr = interaction.fields.getTextInputValue("duration");
  const duration = parsePositiveInt(durationStr);

  if (!duration) {
    await interaction.reply({ content: Texts.schedule.invalidDate, ephemeral: true });
    return;
  }

  // Sofort bestätigen (innerhalb der 3-Sekunden-Frist), erst danach die
  // eigentlichen (potenziell langsameren) DB-Aufrufe ausführen.
  await interaction.deferReply();

  const existingActive = await Sprint.findOne({
    guildId: interaction.guildId,
    status: { $in: ["active", "grace"] },
  });
  if (existingActive) {
    await interaction.editReply({ content: Texts.start.alreadyActive });
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

  const message = await interaction.editReply({ embeds: [embed], components });

  // Speichern, damit der Cleanup-Job (jobs/scheduler.ts) diese Nachricht
  // später löschen kann, sobald der Sprint länger vorbei ist.
  sprint.messageId = message.id;
  await sprint.save();

  // Automatisches Sprintende wird vom Scheduler-Job (jobs/scheduler.ts) übernommen,
  // der regelmäßig prüft, ob active Sprints ihre Endzeit erreicht haben.
}
