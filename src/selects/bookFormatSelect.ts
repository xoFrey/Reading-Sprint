import { StringSelectMenuInteraction, StringSelectMenuBuilder, ActionRowBuilder } from "discord.js";
import { CustomId, buildCustomId, parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { BookFormat } from "../types";
import { showNewBookModal } from "./newBookModalBuilder";

/**
 * Reagiert auf die Format-Auswahl für ein NEUES Buch (Beitritt oder
 * Buchwechsel, siehe joinBookSelect.ts / switchBookSelect.ts).
 *
 * Bei Physisch/Ebook geht's direkt zum Modal. Bei Hörbuch kommt erst noch
 * ein Zwischenschritt (siehe audiobookModeSelect.ts): Std:Min oder % -
 * praktisch, da manche Hörbuch-Apps (z.B. Audible) eher % als eine genaue
 * Position anzeigen.
 *
 * customId-Args: [mode, id] - mode ist "join" (id=sprintId) oder "switch"
 * (id=participantId).
 */
export async function execute(interaction: StringSelectMenuInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [mode, id] = args;
  const format = interaction.values[0] as BookFormat;

  if (format === "audiobook") {
    const select = new StringSelectMenuBuilder()
      .setCustomId(buildCustomId(CustomId.SELECT_AUDIOBOOK_MODE, mode, id))
      .setPlaceholder(Texts.bookFormat.audiobookModePlaceholder)
      .addOptions(
        {
          label: Texts.bookFormat.audiobookModeTimeLabel,
          value: "time",
          description: Texts.bookFormat.audiobookModeTimeDescription,
        },
        {
          label: Texts.bookFormat.audiobookModePercentLabel,
          value: "percent",
          description: Texts.bookFormat.audiobookModePercentDescription,
        }
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
    await interaction.update({ content: Texts.bookFormat.audiobookModePrompt, components: [row] });
    return;
  }

  await showNewBookModal(interaction, mode, id, format, false);
}
