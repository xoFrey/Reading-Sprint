// Eindeutige customId-Präfixe für Buttons/Modals. Der Interaction-Router
// (interactions/router.ts) nutzt diese, um Klicks an den richtigen Handler
// weiterzuleiten. Format: "<prefix>:<zusatzdaten>", z.B. "sprint_join:64abc123".
export const CustomId = {
  PANEL_SCHEDULE: "panel_schedule",
  PANEL_START: "panel_start",
  PANEL_END: "panel_end",
  PANEL_LEADERBOARD: "panel_leaderboard",

  SPRINT_JOIN: "sprint_join",
  SPRINT_MY_PANEL: "sprint_my_panel",
  SCHEDULE_REGISTER: "schedule_register",

  PARTICIPANT_SWITCH_BOOK: "participant_switch_book",
  PARTICIPANT_UPDATE_PAGE: "participant_update_page",
  PARTICIPANT_PAUSE: "participant_pause",
  PARTICIPANT_RESUME: "participant_resume",
  PARTICIPANT_LEAVE: "participant_leave",

  SPRINT_GRACE_UPDATE_PAGE: "sprint_grace_update_page",

  SELECT_JOIN_BOOK: "select_join_book",
  SELECT_SWITCH_BOOK: "select_switch_book",

  MODAL_SCHEDULE: "modal_schedule",
  MODAL_JOIN: "modal_join",
  MODAL_JOIN_EXISTING_BOOK: "modal_join_existing_book",
  MODAL_SWITCH_BOOK: "modal_switch_book",
  MODAL_SWITCH_TO_EXISTING_BOOK: "modal_switch_to_existing_book",
  MODAL_UPDATE_PAGE: "modal_update_page",
} as const;

// Sonderwert für die "Neues Buch eintragen"-Option in den Select-Menüs
// (siehe buttons/joinButton.ts und buttons/switchBookButton.ts).
export const NEW_BOOK_SELECT_VALUE = "__new_book__";

// Baut eine customId inkl. Zusatzdaten (z.B. Sprint- oder Participant-ID).
export function buildCustomId(prefix: string, ...args: string[]): string {
  return [prefix, ...args].join(":");
}

// Zerlegt eine customId wieder in Präfix und Zusatzdaten.
export function parseCustomId(customId: string): { prefix: string; args: string[] } {
  const [prefix, ...args] = customId.split(":");
  return { prefix, args };
}

// Farbpalette und Kulanzzeit-Konfiguration in einem File, da beide "feste,
// serverweit gültige Werte" sind, die nicht ins XP-System gehören.
export const GRACE_PERIOD_MINUTES = 10;
export const MAX_UPCOMING_SPRINTS_SHOWN = 5;
export const MESSAGE_CLEANUP_DELAY_MINUTES = 20;

// Zentrale Farbpalette für Embeds (moderne, ruhige Töne).
export const Colors = {
  primary: 0x5865f2, // Discord Blurple
  success: 0x57f287,
  warning: 0xfee75c,
  danger: 0xed4245,
  neutral: 0x2b2d31,
} as const;
