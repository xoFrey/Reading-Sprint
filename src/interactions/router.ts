import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import { CustomId, parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";

import * as scheduleButton from "../buttons/scheduleButton";
import * as startButton from "../buttons/startButton";
import * as endButton from "../buttons/endButton";
import * as leaderboardButton from "../buttons/leaderboardButton";
import * as joinButton from "../buttons/joinButton";
import * as scheduleRegisterButton from "../buttons/scheduleRegisterButton";
import * as switchBookButton from "../buttons/switchBookButton";
import * as updatePageButton from "../buttons/updatePageButton";
import {
  executePause,
  executeResume,
  executeLeave,
} from "../buttons/participantStatusButtons";

import * as scheduleModal from "../modals/scheduleModal";
import * as startModal from "../modals/startModal";
import * as joinModal from "../modals/joinModal";
import * as switchBookModal from "../modals/switchBookModal";
import * as updatePageModal from "../modals/updatePageModal";

// Explizite Zuordnung statt automatischem Datei-Scan: Buttons/Modals haben
// nicht immer eine 1:1-Beziehung Datei <-> customId (z.B. teilen sich Pause/
// Weiter/Verlassen eine Datei), daher ist eine klare Map hier robuster.
const buttonHandlers: Record<string, (interaction: ButtonInteraction) => Promise<void>> = {
  [CustomId.PANEL_SCHEDULE]: scheduleButton.execute,
  [CustomId.PANEL_START]: startButton.execute,
  [CustomId.PANEL_END]: endButton.execute,
  [CustomId.PANEL_LEADERBOARD]: leaderboardButton.execute,
  [CustomId.SPRINT_JOIN]: joinButton.execute,
  [CustomId.SCHEDULE_REGISTER]: scheduleRegisterButton.execute,
  [CustomId.PARTICIPANT_SWITCH_BOOK]: switchBookButton.execute,
  [CustomId.PARTICIPANT_UPDATE_PAGE]: updatePageButton.execute,
  [CustomId.PARTICIPANT_PAUSE]: executePause,
  [CustomId.PARTICIPANT_RESUME]: executeResume,
  [CustomId.PARTICIPANT_LEAVE]: executeLeave,
};

const modalHandlers: Record<string, (interaction: ModalSubmitInteraction) => Promise<void>> = {
  [CustomId.MODAL_SCHEDULE]: scheduleModal.execute,
  modal_start: startModal.execute,
  [CustomId.MODAL_JOIN]: joinModal.execute,
  [CustomId.MODAL_SWITCH_BOOK]: switchBookModal.execute,
  [CustomId.MODAL_UPDATE_PAGE]: updatePageModal.execute,
};

export async function routeButton(interaction: ButtonInteraction): Promise<void> {
  const { prefix } = parseCustomId(interaction.customId);
  const handler = buttonHandlers[prefix];

  if (!handler) return;

  try {
    await handler(interaction);
  } catch (error) {
    console.error(`[Router] Fehler in Button-Handler "${prefix}":`, error);
    await safeReplyError(interaction);
  }
}

export async function routeModal(interaction: ModalSubmitInteraction): Promise<void> {
  const { prefix } = parseCustomId(interaction.customId);
  const handler = modalHandlers[prefix];

  if (!handler) return;

  try {
    await handler(interaction);
  } catch (error) {
    console.error(`[Router] Fehler in Modal-Handler "${prefix}":`, error);
    await safeReplyError(interaction);
  }
}

async function safeReplyError(
  interaction: ButtonInteraction | ModalSubmitInteraction
): Promise<void> {
  const payload = { content: Texts.errors.generic, ephemeral: true };
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(payload).catch(() => undefined);
  } else {
    await interaction.reply(payload).catch(() => undefined);
  }
}
