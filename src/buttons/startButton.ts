import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import { Texts } from "../config/texts";
import { Sprint } from "../database/models/Sprint";

// customId für das Start-Modal wird hier lokal genutzt (kein eigener Sprint,
// da noch keiner existiert) und im interactionCreate-Event separat behandelt,
// analog zum Schedule-Modal.
export async function execute(interaction: ButtonInteraction): Promise<void> {
  const existingActive = await Sprint.findOne({ guildId: interaction.guildId, status: "active" });
  if (existingActive) {
    await interaction.reply({ content: Texts.start.alreadyActive, ephemeral: true });
    return;
  }

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
