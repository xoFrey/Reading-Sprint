import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import { CustomId } from "../config/constants";
import { Texts } from "../config/texts";

// Zeigt das Modal zum Planen eines Sprints. Die eigentliche Verarbeitung
// der Eingaben passiert im zugehörigen Modal-Handler (modals/scheduleModal.ts).
export async function execute(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId(CustomId.MODAL_SCHEDULE)
    .setTitle(Texts.schedule.modalTitle);

  const dateInput = new TextInputBuilder()
    .setCustomId("date")
    .setLabel(Texts.schedule.dateLabel)
    .setPlaceholder("z.B. 24.12.2026")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const timeInput = new TextInputBuilder()
    .setCustomId("time")
    .setLabel(Texts.schedule.timeLabel)
    .setPlaceholder("z.B. 20:00")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const durationInput = new TextInputBuilder()
    .setCustomId("duration")
    .setLabel(Texts.schedule.durationLabel)
    .setPlaceholder("z.B. 30")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(durationInput)
  );

  await interaction.showModal(modal);
}
