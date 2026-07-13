import { IUser } from "../database/models/User";
import { isStreakEligible } from "../xp/xpService";

/**
 * Prüft, ob der letzte Sprint "gestern" (relativ zu heute) stattfand.
 * Nur dann wird der Streak fortgesetzt statt zurückgesetzt.
 * Vergleich erfolgt auf Tagesbasis, nicht auf exakte 24h, damit z.B.
 * ein Sprint um 23 Uhr und einer um 8 Uhr am Folgetag noch zählt.
 */
function isConsecutiveDay(lastDate: Date | undefined, now: Date): boolean {
  if (!lastDate) return false;

  const last = new Date(lastDate);
  const diffInDays = Math.floor(
    (stripTime(now).getTime() - stripTime(last).getTime()) / (1000 * 60 * 60 * 24)
  );

  return diffInDays === 1;
}

function isSameDay(a: Date, b: Date): boolean {
  return stripTime(a).getTime() === stripTime(b).getTime();
}

function stripTime(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Aktualisiert den Streak eines Nutzers nach Abschluss eines Sprints.
 * Verändert das User-Objekt direkt (kein save()), analog zu applyXPGain,
 * damit der aufrufende SprintService mehrere Änderungen bündeln kann.
 *
 * Regeln:
 * - Zu wenig Seiten gelesen (siehe MIN_PAGES_FOR_STREAK) -> kein Einfluss auf Streak.
 * - Schon heute an einem Sprint teilgenommen -> Streak bleibt unverändert (kein Doppel-Count).
 * - Letzter zählender Sprint war gestern -> Streak +1.
 * - Sonst (Lücke von >1 Tag oder erster Sprint) -> Streak startet neu bei 1.
 */
export function updateStreak(user: IUser, pagesRead: number, now: Date = new Date()): void {
  if (!isStreakEligible(pagesRead)) return;

  if (user.lastSprintDate && isSameDay(user.lastSprintDate, now)) {
    return; // Heute wurde bereits ein zählender Sprint absolviert.
  }

  if (isConsecutiveDay(user.lastSprintDate, now)) {
    user.currentStreak += 1;
  } else {
    user.currentStreak = 1;
  }

  user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
  user.lastSprintDate = now;
}
