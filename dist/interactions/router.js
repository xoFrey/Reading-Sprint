"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeButton = routeButton;
exports.routeModal = routeModal;
exports.routeSelect = routeSelect;
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const scheduleButton = __importStar(require("../buttons/scheduleButton"));
const startButton = __importStar(require("../buttons/startButton"));
const endButton = __importStar(require("../buttons/endButton"));
const leaderboardButton = __importStar(require("../buttons/leaderboardButton"));
const leaderboardPageButton = __importStar(require("../buttons/leaderboardPageButton"));
const joinButton = __importStar(require("../buttons/joinButton"));
const myPanelButton = __importStar(require("../buttons/myPanelButton"));
const scheduleRegisterButton = __importStar(require("../buttons/scheduleRegisterButton"));
const panelCancelScheduleButton = __importStar(require("../buttons/panelCancelScheduleButton"));
const switchBookButton = __importStar(require("../buttons/switchBookButton"));
const updatePageButton = __importStar(require("../buttons/updatePageButton"));
const graceUpdatePageButton = __importStar(require("../buttons/graceUpdatePageButton"));
const sprintResultsPageButton = __importStar(require("../buttons/sprintResultsPageButton"));
const joinParticipantsPageButton = __importStar(require("../buttons/joinParticipantsPageButton"));
const myBooksButton = __importStar(require("../buttons/myBooksButton"));
const editBookButton = __importStar(require("../buttons/editBookButton"));
const deleteBookButton = __importStar(require("../buttons/deleteBookButton"));
const participantStatusButtons_1 = require("../buttons/participantStatusButtons");
const scheduleModal = __importStar(require("../modals/scheduleModal"));
const startModal = __importStar(require("../modals/startModal"));
const joinModal = __importStar(require("../modals/joinModal"));
const joinExistingBookModal = __importStar(require("../modals/joinExistingBookModal"));
const switchBookModal = __importStar(require("../modals/switchBookModal"));
const switchToExistingBookModal = __importStar(require("../modals/switchToExistingBookModal"));
const updatePageModal = __importStar(require("../modals/updatePageModal"));
const editBookModal = __importStar(require("../modals/editBookModal"));
const joinBookSelect = __importStar(require("../selects/joinBookSelect"));
const switchBookSelect = __importStar(require("../selects/switchBookSelect"));
const bookFormatSelect = __importStar(require("../selects/bookFormatSelect"));
const manageBookSelect = __importStar(require("../selects/manageBookSelect"));
const cancelScheduleSelect = __importStar(require("../selects/cancelScheduleSelect"));
// Explizite Zuordnung statt automatischem Datei-Scan: Buttons/Modals haben
// nicht immer eine 1:1-Beziehung Datei <-> customId (z.B. teilen sich Pause/
// Weiter/Verlassen eine Datei), daher ist eine klare Map hier robuster.
const buttonHandlers = {
    [constants_1.CustomId.PANEL_SCHEDULE]: scheduleButton.execute,
    [constants_1.CustomId.PANEL_START]: startButton.execute,
    [constants_1.CustomId.PANEL_END]: endButton.execute,
    [constants_1.CustomId.PANEL_LEADERBOARD]: leaderboardButton.execute,
    [constants_1.CustomId.LEADERBOARD_PAGE]: leaderboardPageButton.execute,
    [constants_1.CustomId.PANEL_MY_BOOKS]: myBooksButton.execute,
    [constants_1.CustomId.PANEL_CANCEL_SCHEDULE]: panelCancelScheduleButton.execute,
    [constants_1.CustomId.SPRINT_JOIN]: joinButton.execute,
    [constants_1.CustomId.SPRINT_MY_PANEL]: myPanelButton.execute,
    [constants_1.CustomId.SCHEDULE_REGISTER]: scheduleRegisterButton.execute,
    [constants_1.CustomId.PARTICIPANT_SWITCH_BOOK]: switchBookButton.execute,
    [constants_1.CustomId.PARTICIPANT_UPDATE_PAGE]: updatePageButton.execute,
    [constants_1.CustomId.PARTICIPANT_PAUSE]: participantStatusButtons_1.executePause,
    [constants_1.CustomId.PARTICIPANT_RESUME]: participantStatusButtons_1.executeResume,
    [constants_1.CustomId.PARTICIPANT_LEAVE]: participantStatusButtons_1.executeLeave,
    [constants_1.CustomId.SPRINT_GRACE_UPDATE_PAGE]: graceUpdatePageButton.execute,
    [constants_1.CustomId.SPRINT_RESULTS_PAGE]: sprintResultsPageButton.execute,
    [constants_1.CustomId.JOIN_PARTICIPANTS_PAGE]: joinParticipantsPageButton.execute,
    [constants_1.CustomId.BOOK_EDIT]: editBookButton.execute,
    [constants_1.CustomId.BOOK_DELETE]: deleteBookButton.execute,
};
const modalHandlers = {
    [constants_1.CustomId.MODAL_SCHEDULE]: scheduleModal.execute,
    modal_start: startModal.execute,
    [constants_1.CustomId.MODAL_JOIN]: joinModal.execute,
    [constants_1.CustomId.MODAL_JOIN_EXISTING_BOOK]: joinExistingBookModal.execute,
    [constants_1.CustomId.MODAL_SWITCH_BOOK]: switchBookModal.execute,
    [constants_1.CustomId.MODAL_SWITCH_TO_EXISTING_BOOK]: switchToExistingBookModal.execute,
    [constants_1.CustomId.MODAL_UPDATE_PAGE]: updatePageModal.execute,
    [constants_1.CustomId.MODAL_EDIT_BOOK]: editBookModal.execute,
};
const selectHandlers = {
    [constants_1.CustomId.SELECT_JOIN_BOOK]: joinBookSelect.execute,
    [constants_1.CustomId.SELECT_SWITCH_BOOK]: switchBookSelect.execute,
    [constants_1.CustomId.SELECT_NEW_BOOK_FORMAT]: bookFormatSelect.execute,
    [constants_1.CustomId.SELECT_MANAGE_BOOK]: manageBookSelect.execute,
    [constants_1.CustomId.SELECT_CANCEL_SCHEDULE]: cancelScheduleSelect.execute,
};
async function routeButton(interaction) {
    const { prefix } = (0, constants_1.parseCustomId)(interaction.customId);
    const handler = buttonHandlers[prefix];
    if (!handler)
        return;
    try {
        await handler(interaction);
    }
    catch (error) {
        console.error(`[Router] Fehler in Button-Handler "${prefix}":`, error);
        await safeReplyError(interaction);
    }
}
async function routeModal(interaction) {
    const { prefix } = (0, constants_1.parseCustomId)(interaction.customId);
    const handler = modalHandlers[prefix];
    if (!handler)
        return;
    try {
        await handler(interaction);
    }
    catch (error) {
        console.error(`[Router] Fehler in Modal-Handler "${prefix}":`, error);
        await safeReplyError(interaction);
    }
}
async function routeSelect(interaction) {
    const { prefix } = (0, constants_1.parseCustomId)(interaction.customId);
    const handler = selectHandlers[prefix];
    if (!handler)
        return;
    try {
        await handler(interaction);
    }
    catch (error) {
        console.error(`[Router] Fehler in Select-Handler "${prefix}":`, error);
        await safeReplyError(interaction);
    }
}
async function safeReplyError(interaction) {
    const payload = { content: texts_1.Texts.errors.generic, ephemeral: true };
    if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => undefined);
    }
    else {
        await interaction.reply(payload).catch(() => undefined);
    }
}
