import { ModalSubmitInteraction } from "discord.js";
import { Texts } from "../config/texts";
import { parseTimeRelativeToNow } from "../utils/parsing";
import { Sprint } from "../database/models/Sprint";
import { startSprint } from "../services/sprintService";
import { hasOverlappingSprint } from "../services/overlapService";
import { getRoleMention } from "../utils/guildConfig";
import { buildJoinEmbed } from "../embeds/joinEmbed";

export async function execute(interaction: ModalSubmitInteraction): Promise<void> {
  const endTimeStr = interaction.fields.getTextInputValue("endTime");
  const endTime = parseTimeRelativeToNow(endTimeStr);

  if (!endTime) {
    await interaction.reply({ content: Texts.schedule.invalidDate, ephemeral: true });
    return;
  }

  // Dauer wird aus "jetzt bis Enduhrzeit" berechnet (parseTimeRelativeToNow
  // nimmt automatisch den nächsten Tag an, falls die Uhrzeit heute schon
  // vorbei wäre - unterstützt so auch Sprints über Mitternacht).
  const duration = Math.round((endTime.getTime() - Date.now()) / 60_000);

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

  const overlaps = await hasOverlappingSprint(interaction.guildId!, new Date(), duration);
  if (overlaps) {
    await interaction.editReply({ content: Texts.schedule.overlap });
    return;
  }

  const sprint = await startSprint(
    interaction.guildId!,
    interaction.channelId!,
    interaction.user.id,
    duration
  );

  const sprintEndTime = new Date(sprint.startTime.getTime() + duration * 60_000);
  const { embed, components } = buildJoinEmbed(sprint.id, duration, sprintEndTime);

  const message = await interaction.editReply({
    content: getRoleMention() || undefined,
    embeds: [embed],
    components,
  });

  // Speichern, damit der Cleanup-Job (jobs/scheduler.ts) diese Nachricht
  // später löschen kann, sobald der Sprint länger vorbei ist.
  sprint.messageId = message.id;
  await sprint.save();

  // Automatisches Sprintende wird vom Scheduler-Job (jobs/scheduler.ts) übernommen,
  // der regelmäßig prüft, ob active Sprints ihre Endzeit erreicht haben.
}
