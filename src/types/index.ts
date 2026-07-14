// Zentrale Typdefinitionen, die von mehreren Modulen genutzt werden.
// Vermeidet zirkuläre Imports zwischen den Mongoose-Modellen.

export type SprintStatus = "pending" | "active" | "grace" | "ended";
export type ParticipantStatus = "active" | "paused" | "left";
export type ScheduledSprintStatus = "scheduled" | "triggered" | "cancelled";

// Ein einzelnes Buch, das ein Teilnehmer während eines Sprints liest.
export interface ParticipantBook {
  title: string;
  startPage: number;
  currentPage: number;
  totalPages: number;
  goalPage?: number;
  isFinished: boolean;
}

// Konfigurierbare XP-Werte (siehe config/xpConfig.ts in einem späteren Schritt).
export interface XPConfig {
  pagesPerXP: number;
  goalBonus: number;
  streakBonus: number;
  finishBonus: number;
}
