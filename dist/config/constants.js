"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Colors = exports.MESSAGE_CLEANUP_DELAY_MINUTES = exports.MAX_UPCOMING_SPRINTS_SHOWN = exports.GRACE_PERIOD_MINUTES = exports.NEW_BOOK_SELECT_VALUE = exports.CustomId = void 0;
exports.buildCustomId = buildCustomId;
exports.parseCustomId = parseCustomId;
// Eindeutige customId-Präfixe für Buttons/Modals. Der Interaction-Router
// (interactions/router.ts) nutzt diese, um Klicks an den richtigen Handler
// weiterzuleiten. Format: "<prefix>:<zusatzdaten>", z.B. "sprint_join:64abc123".
exports.CustomId = {
    PANEL_SCHEDULE: "panel_schedule",
    PANEL_START: "panel_start",
    PANEL_END: "panel_end",
    PANEL_LEADERBOARD: "panel_leaderboard",
    PANEL_MY_BOOKS: "panel_my_books",
    PANEL_CANCEL_SCHEDULE: "panel_cancel_schedule",
    SPRINT_JOIN: "sprint_join",
    SPRINT_MY_PANEL: "sprint_my_panel",
    SCHEDULE_REGISTER: "schedule_register",
    PARTICIPANT_SWITCH_BOOK: "participant_switch_book",
    PARTICIPANT_UPDATE_PAGE: "participant_update_page",
    PARTICIPANT_PAUSE: "participant_pause",
    PARTICIPANT_RESUME: "participant_resume",
    PARTICIPANT_LEAVE: "participant_leave",
    SPRINT_GRACE_UPDATE_PAGE: "sprint_grace_update_page",
    SPRINT_RESULTS_PAGE: "sprint_results_page",
    JOIN_PARTICIPANTS_PAGE: "join_participants_page",
    LEADERBOARD_PAGE: "leaderboard_page",
    BOOK_EDIT: "book_edit",
    BOOK_DELETE: "book_delete",
    SELECT_JOIN_BOOK: "select_join_book",
    SELECT_SWITCH_BOOK: "select_switch_book",
    SELECT_MANAGE_BOOK: "select_manage_book",
    SELECT_CANCEL_SCHEDULE: "select_cancel_schedule",
    SELECT_NEW_BOOK_FORMAT: "select_new_book_format",
    MODAL_SCHEDULE: "modal_schedule",
    MODAL_JOIN: "modal_join",
    MODAL_JOIN_EXISTING_BOOK: "modal_join_existing_book",
    MODAL_SWITCH_BOOK: "modal_switch_book",
    MODAL_SWITCH_TO_EXISTING_BOOK: "modal_switch_to_existing_book",
    MODAL_UPDATE_PAGE: "modal_update_page",
    MODAL_EDIT_BOOK: "modal_edit_book",
};
// Sonderwert für die "Neues Buch eintragen"-Option in den Select-Menüs
// (siehe buttons/joinButton.ts und buttons/switchBookButton.ts).
exports.NEW_BOOK_SELECT_VALUE = "__new_book__";
// Baut eine customId inkl. Zusatzdaten (z.B. Sprint- oder Participant-ID).
function buildCustomId(prefix, ...args) {
    return [prefix, ...args].join(":");
}
// Zerlegt eine customId wieder in Präfix und Zusatzdaten.
function parseCustomId(customId) {
    const [prefix, ...args] = customId.split(":");
    return { prefix, args };
}
// Farbpalette und Kulanzzeit-Konfiguration in einem File, da beide "feste,
// serverweit gültige Werte" sind, die nicht ins XP-System gehören.
exports.GRACE_PERIOD_MINUTES = 10;
exports.MAX_UPCOMING_SPRINTS_SHOWN = 5;
exports.MESSAGE_CLEANUP_DELAY_MINUTES = 20;
// Zentrale Farbpalette für Embeds (moderne, ruhige Töne).
exports.Colors = {
    primary: 0x5865f2, // Discord Blurple
    success: 0x57f287,
    warning: 0xfee75c,
    danger: 0xed4245,
    neutral: 0x2b2d31,
};
