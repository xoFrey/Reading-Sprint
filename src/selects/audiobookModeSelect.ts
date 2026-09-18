import { StringSelectMenuInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { showNewBookModal } from "./newBookModalBuilder";

/**
 * Reagiert auf die Eingabe-Modus-Wahl für ein neues Hörbuch (siehe
 * bookFormatSelect.ts). Baut danach dasselbe Modal wie Physisch/Ebook, nur
 * mit percentMode entsprechend gesetzt.
 *
 * customId-Args: [mode, id] - identisch zu bookFormatSelect.ts, einfach
 * durchgereicht.
 */
export async function execute(interaction: StringSelectMenuInteraction): Promise<void> {
  const { args } = parseCustomId(interaction.customId);
  const [mode, id] = args;
  const percentMode = interaction.values[0] === "percent";

  await showNewBookModal(interaction, mode, id, "audiobook", percentMode);
}
