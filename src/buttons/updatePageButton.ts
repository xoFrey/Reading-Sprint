import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import { CustomId, buildCustomId, parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";

export async function execute(interaction: ButtonInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [participantId] = args;

  const modal = new ModalBuilder()
    .setCustomId(buildCustomId(CustomId.MODAL_UPDATE_PAGE, participantId))
    .setTitle(Texts.participant.updatePageModalTitle);

  const pageInput = new TextInputBuilder()
    .setCustomId("currentPage")
    .setLabel(Texts.participant.updatePageLabel)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(pageInput));

  await interaction.showModal(modal);
}
