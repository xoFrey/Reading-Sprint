// Eindeutige customId-Präfixe für Buttons/Modals. Der Interaction-Router
// (interactions/router.ts) nutzt diese, um Klicks an den richtigen Handler
// weiterzuleiten. Format: "<prefix>:<zusatzdaten>", z.B. "sprint_join:64abc123".
export const CustomId = {
  PANEL_SCHEDULE: "panel_schedule",
  PANEL_START: "panel_start",
  PANEL_END: "panel_end",
  PANEL_LEADERBOARD: "panel_leaderboard",

  SPRINT_JOIN: "sprint_join",
  SCHEDULE_REGISTER: "schedule_register",

  PARTICIPANT_SWITCH_BOOK: "participant_switch_book",
  PARTICIPANT_UPDATE_PAGE: "participant_update_page",
  PARTICIPANT_PAUSE: "participant_pause",
  PARTICIPANT_RESUME: "participant_resume",
  PARTICIPANT_LEAVE: "participant_leave",

  MODAL_SCHEDULE: "modal_schedule",
  MODAL_JOIN: "modal_join",
  MODAL_SWITCH_BOOK: "modal_switch_book",
  MODAL_UPDATE_PAGE: "modal_update_page",
} as const;

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

// Zentrale Farbpalette für Embeds (moderne, ruhige Töne).
export const Colors = {
  primary: 0x5865f2, // Discord Blurple
  success: 0x57f287,
  warning: 0xfee75c,
  danger: 0xed4245,
  neutral: 0x2b2d31,
} as const;
