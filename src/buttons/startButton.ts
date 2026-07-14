import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import { Texts } from "../config/texts";

// Kein DB-Aufruf vor showModal (siehe joinButton.ts für die Begründung).
// Die Prüfung auf einen bereits aktiven Sprint passiert stattdessen in
// modals/startModal.ts, direkt nach dem sofortigen deferReply().
export async function execute(interaction: ButtonInteraction): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId("modal_start") // eigenes, einfaches Modal - nur ein Feld
    .setTitle(Texts.start.modalTitle);

  const durationInput = new TextInputBuilder()
    .setCustomId("duration")
    .setLabel(Texts.start.durationLabel)
    .setPlaceholder("z.B. 30")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(durationInput));

  await interaction.showModal(modal);
}
