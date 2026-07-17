import { ButtonInteraction, StringSelectMenuBuilder, ActionRowBuilder } from "discord.js";
import { CustomId, buildCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { ScheduledSprint } from "../database/models/ScheduledSprint";

export async function execute(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const scheduledSprints = await ScheduledSprint.find({
    guildId: interaction.guildId,
    status: "scheduled",
  }).sort({ scheduledStart: 1 });

  if (scheduledSprints.length === 0) {
    await interaction.editReply({ content: Texts.scheduleCancel.noneScheduled });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(buildCustomId(CustomId.SELECT_CANCEL_SCHEDULE))
    .setPlaceholder(Texts.scheduleCancel.selectPlaceholder)
    .addOptions(
      scheduledSprints.map((sprint) => ({
        label: sprint.scheduledStart.toLocaleString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: sprint.id,
        description: `Dauer: ${sprint.duration} Minuten`,
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.editReply({ content: Texts.scheduleCancel.selectPlaceholder, components: [row] });
}
