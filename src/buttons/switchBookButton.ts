import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import { CustomId, buildCustomId, parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";

export async function execute(interaction: ButtonInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [participantId] = args;

  const modal = new ModalBuilder()
    .setCustomId(buildCustomId(CustomId.MODAL_SWITCH_BOOK, participantId))
    .setTitle(Texts.join.modalTitle);

  const titleInput = new TextInputBuilder()
    .setCustomId("title")
    .setLabel(Texts.join.bookTitleLabel)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const currentPageInput = new TextInputBuilder()
    .setCustomId("currentPage")
    .setLabel(Texts.join.currentPageLabel)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const totalPagesInput = new TextInputBuilder()
    .setCustomId("totalPages")
    .setLabel(Texts.join.totalPagesLabel)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const goalPageInput = new TextInputBuilder()
    .setCustomId("goalPage")
    .setLabel(Texts.join.goalPageLabel)
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(currentPageInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(totalPagesInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(goalPageInput)
  );

  await interaction.showModal(modal);
}
