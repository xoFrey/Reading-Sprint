import { IUser } from "../database/models/User";
import { XPConfig } from "../types";
import { calculateLevelProgress } from "./levelCurve";
import { MIN_PAGES_FOR_STREAK } from "../config/xpConfig";

// Eingabewerte, aus denen die XP für einen abgeschlossenen Sprint berechnet werden.
export interface SprintXPInput {
  pagesRead: number;
  goalReached: boolean;
  finishedBooksCount: number; // Anzahl in diesem Sprint fertiggelesener Bücher
  currentStreak: number; // Streak NACH diesem Sprint (inkl. heute)
}

export interface LevelUpResult {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
}

/**
 * Berechnet die XP, die ein Teilnehmer für einen einzelnen Sprint erhält.
 * Reine Funktion ohne Seiteneffekte -> gut testbar und wiederverwendbar
 * (z.B. auch für eine Vorschau im Sprint-Ende-Embed).
 */
// Prüft, ob eine Sprint-Teilnahme grundsätzlich für den Streak zählt.
// Wird auch vom Sprint-System genutzt, um User.currentStreak zu erhöhen/zurückzusetzen.
export function isStreakEligible(pagesRead: number): boolean {
  return pagesRead >= MIN_PAGES_FOR_STREAK;
}

export function calculateSprintXP(config: XPConfig, input: SprintXPInput): number {
  let xp = 0;

  xp += input.pagesRead * config.pagesPerXP;

  if (input.goalReached) {
    xp += config.goalBonus;
  }

  if (input.finishedBooksCount > 0) {
    xp += input.finishedBooksCount * config.finishBonus;
  }

  // Streak-Bonus gibt es nur, wenn die Mindestseitenzahl gelesen wurde.
  // Sonst könnte man mit 1 Seite pro Tag künstlich einen Streak "am Leben halten".
  const streakEligible = input.pagesRead >= MIN_PAGES_FOR_STREAK;
  if (streakEligible && input.currentStreak > 1) {
    xp += input.currentStreak * config.streakBonus;
  }

  // Letzte Absicherung: sollte trotz aller Prüfungen doch NaN entstehen
  // (z.B. durch fehlerhafte Altdaten), lieber 0 XP vergeben als die
  // Datenbank-Validierung crashen zu lassen.
  return Number.isFinite(xp) ? Math.round(xp) : 0;
}

/**
 * Vergibt XP an einen Nutzer, aktualisiert dessen Level und gibt zurück,
 * ob dabei ein Level-Up stattgefunden hat (relevant für eine Glückwunsch-Nachricht).
 *
 * Persistiert die Änderung NICHT selbst (kein user.save()) -> der aufrufende
 * Service (z.B. SprintService) entscheidet, wann gespeichert wird, damit
 * mehrere Änderungen in einem Aufruf gebündelt werden können.
 */
export function applyXPGain(user: IUser, amount: number): LevelUpResult {
  // Absicherung gegen bereits fehlerhaft gespeicherte Altdaten (z.B. xp: NaN
  // durch einen früheren Bug) - sonst würde der Fehler sich für immer fortsetzen.
  if (!Number.isFinite(user.xp)) user.xp = 0;

  const oldLevel = calculateLevelProgress(user.xp).level;

  user.xp += amount;

  const newLevel = calculateLevelProgress(user.xp).level;
  user.level = newLevel;

  return {
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
  };
}
