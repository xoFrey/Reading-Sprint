import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import { CustomId, buildCustomId, parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { SprintParticipant } from "../database/models/SprintParticipant";

/**
 * Sitzt auf der ÖFFENTLICHEN Kulanzzeit-Nachricht (siehe jobs/scheduler.ts).
 * Da diese Nachricht nicht an eine bestimmte Person gebunden ist, wird der
 * passende SprintParticipant erst beim Klick anhand von sprintId + eigener
 * userId gesucht - praktisch für den Fall, dass jemand sein privates
 * Teilnehmer-Panel versehentlich weggeklickt hat.
 */
export async function execute(interaction: ButtonInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [sprintId] = args;

  const participant = await SprintParticipant.findOne({
    sprintId,
    userId: interaction.user.id,
    status: { $ne: "left" },
  });

  if (!participant) {
    await interaction.reply({ content: Texts.errors.notInSprint, ephemeral: true });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(buildCustomId(CustomId.MODAL_UPDATE_PAGE, participant.id))
    .setTitle(Texts.participant.updatePageModalTitle);

  const pageInput = new TextInputBuilder()
    .setCustomId("currentPage")
    .setLabel(Texts.participant.updatePageLabel)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(pageInput));

  await interaction.showModal(modal);
}
