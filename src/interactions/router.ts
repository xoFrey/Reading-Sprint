import { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from "discord.js";
import { CustomId, parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";

import * as scheduleButton from "../buttons/scheduleButton";
import * as startButton from "../buttons/startButton";
import * as endButton from "../buttons/endButton";
import * as leaderboardButton from "../buttons/leaderboardButton";
import * as leaderboardPageButton from "../buttons/leaderboardPageButton";
import * as joinButton from "../buttons/joinButton";
import * as myPanelButton from "../buttons/myPanelButton";
import * as scheduleRegisterButton from "../buttons/scheduleRegisterButton";
import * as panelCancelScheduleButton from "../buttons/panelCancelScheduleButton";
import * as switchBookButton from "../buttons/switchBookButton";
import * as updatePageButton from "../buttons/updatePageButton";
import * as graceUpdatePageButton from "../buttons/graceUpdatePageButton";
import * as sprintResultsPageButton from "../buttons/sprintResultsPageButton";
import * as joinParticipantsPageButton from "../buttons/joinParticipantsPageButton";
import * as myBooksButton from "../buttons/myBooksButton";
import * as editBookButton from "../buttons/editBookButton";
import * as deleteBookButton from "../buttons/deleteBookButton";
import {
  executePause,
  executeResume,
  executeLeave,
} from "../buttons/participantStatusButtons";

import * as scheduleModal from "../modals/scheduleModal";
import * as startModal from "../modals/startModal";
import * as joinModal from "../modals/joinModal";
import * as joinExistingBookModal from "../modals/joinExistingBookModal";
import * as switchBookModal from "../modals/switchBookModal";
import * as switchToExistingBookModal from "../modals/switchToExistingBookModal";
import * as updatePageModal from "../modals/updatePageModal";
import * as editBookModal from "../modals/editBookModal";

import * as joinBookSelect from "../selects/joinBookSelect";
import * as switchBookSelect from "../selects/switchBookSelect";
import * as manageBookSelect from "../selects/manageBookSelect";
import * as cancelScheduleSelect from "../selects/cancelScheduleSelect";

// Explizite Zuordnung statt automatischem Datei-Scan: Buttons/Modals haben
// nicht immer eine 1:1-Beziehung Datei <-> customId (z.B. teilen sich Pause/
// Weiter/Verlassen eine Datei), daher ist eine klare Map hier robuster.
const buttonHandlers: Record<string, (interaction: ButtonInteraction) => Promise<void>> = {
  [CustomId.PANEL_SCHEDULE]: scheduleButton.execute,
  [CustomId.PANEL_START]: startButton.execute,
  [CustomId.PANEL_END]: endButton.execute,
  [CustomId.PANEL_LEADERBOARD]: leaderboardButton.execute,
  [CustomId.LEADERBOARD_PAGE]: leaderboardPageButton.execute,
  [CustomId.PANEL_MY_BOOKS]: myBooksButton.execute,
  [CustomId.PANEL_CANCEL_SCHEDULE]: panelCancelScheduleButton.execute,
  [CustomId.SPRINT_JOIN]: joinButton.execute,
  [CustomId.SPRINT_MY_PANEL]: myPanelButton.execute,
  [CustomId.SCHEDULE_REGISTER]: scheduleRegisterButton.execute,
  [CustomId.PARTICIPANT_SWITCH_BOOK]: switchBookButton.execute,
  [CustomId.PARTICIPANT_UPDATE_PAGE]: updatePageButton.execute,
  [CustomId.PARTICIPANT_PAUSE]: executePause,
  [CustomId.PARTICIPANT_RESUME]: executeResume,
  [CustomId.PARTICIPANT_LEAVE]: executeLeave,
  [CustomId.SPRINT_GRACE_UPDATE_PAGE]: graceUpdatePageButton.execute,
  [CustomId.SPRINT_RESULTS_PAGE]: sprintResultsPageButton.execute,
  [CustomId.JOIN_PARTICIPANTS_PAGE]: joinParticipantsPageButton.execute,
  [CustomId.BOOK_EDIT]: editBookButton.execute,
  [CustomId.BOOK_DELETE]: deleteBookButton.execute,
};

const modalHandlers: Record<string, (interaction: ModalSubmitInteraction) => Promise<void>> = {
  [CustomId.MODAL_SCHEDULE]: scheduleModal.execute,
  modal_start: startModal.execute,
  [CustomId.MODAL_JOIN]: joinModal.execute,
  [CustomId.MODAL_JOIN_EXISTING_BOOK]: joinExistingBookModal.execute,
  [CustomId.MODAL_SWITCH_BOOK]: switchBookModal.execute,
  [CustomId.MODAL_SWITCH_TO_EXISTING_BOOK]: switchToExistingBookModal.execute,
  [CustomId.MODAL_UPDATE_PAGE]: updatePageModal.execute,
  [CustomId.MODAL_EDIT_BOOK]: editBookModal.execute,
};

const selectHandlers: Record<string, (interaction: StringSelectMenuInteraction) => Promise<void>> = {
  [CustomId.SELECT_JOIN_BOOK]: joinBookSelect.execute,
  [CustomId.SELECT_SWITCH_BOOK]: switchBookSelect.execute,
  [CustomId.SELECT_MANAGE_BOOK]: manageBookSelect.execute,
  [CustomId.SELECT_CANCEL_SCHEDULE]: cancelScheduleSelect.execute,
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

export async function routeSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const { prefix } = parseCustomId(interaction.customId);
  const handler = selectHandlers[prefix];

  if (!handler) return;

  try {
    await handler(interaction);
  } catch (error) {
    console.error(`[Router] Fehler in Select-Handler "${prefix}":`, error);
    await safeReplyError(interaction);
  }
}

async function safeReplyError(
  interaction: ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction
): Promise<void> {
  const payload = { content: Texts.errors.generic, ephemeral: true };
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(payload).catch(() => undefined);
  } else {
    await interaction.reply(payload).catch(() => undefined);
  }
}
