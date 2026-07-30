// Zentrale Typdefinitionen, die von mehreren Modulen genutzt werden.
// Vermeidet zirkuläre Imports zwischen den Mongoose-Modellen.

export type SprintStatus = "pending" | "active" | "grace" | "ended";
export type ParticipantStatus = "active" | "paused" | "left";
export type ScheduledSprintStatus = "scheduled" | "triggered" | "cancelled";

export type BookFormat = "physical" | "ebook" | "audiobook";

// Ein einzelnes Buch, das ein Teilnehmer während eines Sprints liest.
// Je nach `format` werden unterschiedliche Felder genutzt:
// - physical: startPage/currentPage/totalPages/goalPage (Seiten)
// - ebook: startPercent/currentPercent/goalPercent (Prozent) + totalPages
//   (Gesamtseitenzahl bleibt bekannt, nur der FORTSCHRITT läuft über Prozent -
//   daraus lässt sich die gelesene Seitenzahl exakt zurückrechnen)
// - audiobook: startMinutes/currentMinutes/totalMinutes/goalMinutes (Minuten)
//
// Die format-spezifische Berechnungs-/Anzeigelogik lebt zentral in
// services/bookProgress.ts, damit sie nicht an jeder Stelle dupliziert wird.
export interface ParticipantBook {
  title: string;
  format: BookFormat;

  // physical & ebook
  totalPages?: number;
  startPage?: number;
  currentPage?: number;
  goalPage?: number;

  // ebook (zusätzlich zu totalPages)
  startPercent?: number;
  currentPercent?: number;
  goalPercent?: number;

  // audiobook (alles in Minuten)
  totalMinutes?: number;
  startMinutes?: number;
  currentMinutes?: number;
  goalMinutes?: number;

  isFinished: boolean;
}

// Konfigurierbare XP-Werte (siehe config/xpConfig.ts in einem späteren Schritt).
export interface XPConfig {
  pagesPerXP: number;
  goalBonus: number;
  streakBonus: number;
  finishBonus: number;
}
