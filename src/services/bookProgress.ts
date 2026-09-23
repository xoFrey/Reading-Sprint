import { BookFormat, ParticipantBook } from "../types";

// Umrechnungsfaktor Hörbuch-Minuten -> Seiten-Äquivalent für die XP-Berechnung.
// ~150 Wörter/Minute Vorlesegeschwindigkeit vs. ~270 Wörter/Buchseite ergibt
// grob 0,45 Seiten pro gehörter Minute (≈27 Seiten/Stunde). Konfigurierbar,
// falls sich das in der Praxis als zu großzügig/knapp herausstellt.
export const AUDIOBOOK_MINUTES_PER_PAGE = 0.45;

// Kurzform, ob ein Hörbuch über % statt Std:Min getrackt wird - an mehreren
// Stellen gebraucht, daher als kleiner Helfer statt jedes Mal "book.format
// === 'audiobook' && book.audiobookPercentMode" auszuschreiben.
function isAudiobookPercent(book: Pick<ParticipantBook, "format" | "audiobookPercentMode">): boolean {
  return book.format === "audiobook" && book.audiobookPercentMode === true;
}

// Liefert den aktuellen Rohwert eines Buchs (Seite/Prozent/Minute, je nach
// Format), z.B. um ihn beim Buchwechsel als Vorschlag für "wo aufgehört"
// vorauszufüllen. undefined, falls (noch) kein Fortschritt gesetzt ist.
export function getCurrentValue(book: ParticipantBook): number | undefined {
  if (book.format === "physical") return book.currentPage;
  if (book.format === "ebook") return book.currentPercent;
  return isAudiobookPercent(book) ? book.currentPercent : book.currentMinutes;
}

// Liefert Start- und Maximalwert für die Fortschritts-Validierung, in der
// jeweils passenden Einheit (Seite/Prozent/Minute). Zentral hier, weil sonst
// an mehreren Stellen (Buchwechsel, "Seite aktualisieren") dieselbe
// Fallunterscheidung nötig wäre - und weil das leicht falsch geht: Prozent-
// Fortschritt muss gegen 100 geprüft werden, NICHT gegen die Gesamtseitenzahl.
export function getProgressBounds(book: ParticipantBook): { start: number; max: number } | undefined {
  switch (book.format) {
    case "physical":
      if (book.startPage === undefined || book.totalPages === undefined) return undefined;
      return { start: book.startPage, max: book.totalPages };
    case "ebook":
      if (book.startPercent === undefined) return undefined;
      return { start: book.startPercent, max: 100 };
    case "audiobook":
      if (isAudiobookPercent(book)) {
        if (book.startPercent === undefined) return undefined;
        return { start: book.startPercent, max: 100 };
      }
      if (book.startMinutes === undefined || book.totalMinutes === undefined) return undefined;
      return { start: book.startMinutes, max: book.totalMinutes };
  }
}

/**
 * Formatiert Minuten als "H:MM" fürs Eintippen in Modals (z.B. "2:30").
 * Bewusst anders als utils/format.ts#formatMinutes ("2 Std 30 Min"), das ist
 * für die Anzeige gedacht, dieses Format hier fürs kompakte Eintippen.
 */
export function formatHM(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Parst eine Zeitangabe im Format "H:MM" oder "HH:MM" (z.B. "2:30" = 150 Minuten).
 * Gibt null zurück bei ungültigem Format oder Minuten >= 60.
 */
export function parseDurationHM(input: string): number | null {
  const match = input.trim().match(/^(\d{1,4}):(\d{1,2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (minutes >= 60) return null;

  return hours * 60 + minutes;
}

/**
 * Berechnet, wie viele Seiten in diesem Sprint für dieses Buch gelesen wurden -
 * unabhängig vom Format, immer als "Seiten-Äquivalent" (Grundlage für XP,
 * Leaderboard-Ranking und das Sprintende-"Gesamt"-Feld). Läuft komplett im
 * Hintergrund; die Anzeige bleibt trotzdem format-gerecht (siehe unten).
 */
export function getPagesEquivalent(book: ParticipantBook): number {
  switch (book.format) {
    case "physical": {
      if (book.currentPage == null || book.startPage == null) return 0;
      return Math.max(0, book.currentPage - book.startPage);
    }
    case "ebook": {
      if (book.currentPercent == null || book.startPercent == null || !book.totalPages) return 0;
      const percentRead = Math.max(0, book.currentPercent - book.startPercent) / 100;
      return percentRead * book.totalPages;
    }
    case "audiobook": {
      if (isAudiobookPercent(book)) {
        if (book.currentPercent == null || book.startPercent == null || !book.totalMinutes) return 0;
        const percentListened = Math.max(0, book.currentPercent - book.startPercent) / 100;
        return percentListened * book.totalMinutes * AUDIOBOOK_MINUTES_PER_PAGE;
      }
      if (book.currentMinutes == null || book.startMinutes == null) return 0;
      const minutesListened = Math.max(0, book.currentMinutes - book.startMinutes);
      return minutesListened * AUDIOBOOK_MINUTES_PER_PAGE;
    }
  }
}

/**
 * Prüft, ob das (optionale) Sprint-Ziel für dieses Buch erreicht wurde.
 * Ein Ziel zählt nur, wenn es beim Sprintstart noch NICHT bereits erfüllt
 * war (sonst wäre "0 gelesen, Ziel schon vorher erreicht" fälschlich "erreicht").
 */
export function isBookGoalReached(book: ParticipantBook): boolean {
  switch (book.format) {
    case "physical":
      return (
        book.goalPage !== undefined &&
        book.startPage !== undefined &&
        book.currentPage !== undefined &&
        book.startPage < book.goalPage &&
        book.currentPage >= book.goalPage
      );
    case "ebook":
      return (
        book.goalPercent !== undefined &&
        book.startPercent !== undefined &&
        book.currentPercent !== undefined &&
        book.startPercent < book.goalPercent &&
        book.currentPercent >= book.goalPercent
      );
    case "audiobook":
      if (isAudiobookPercent(book)) {
        return (
          book.goalPercent !== undefined &&
          book.startPercent !== undefined &&
          book.currentPercent !== undefined &&
          book.startPercent < book.goalPercent &&
          book.currentPercent >= book.goalPercent
        );
      }
      return (
        book.goalMinutes !== undefined &&
        book.startMinutes !== undefined &&
        book.currentMinutes !== undefined &&
        book.startMinutes < book.goalMinutes &&
        book.currentMinutes >= book.goalMinutes
      );
  }
}

/**
 * True, sobald der aktuelle Fortschritt das Ende des Buchs erreicht hat
 * (100% bzw. letzte Seite/Minute) - unabhängig vom Ziel.
 */
export function isBookComplete(book: ParticipantBook): boolean {
  switch (book.format) {
    case "physical":
      return book.currentPage !== undefined && book.totalPages !== undefined && book.currentPage >= book.totalPages;
    case "ebook":
      return book.currentPercent !== undefined && book.currentPercent >= 100;
    case "audiobook":
      if (isAudiobookPercent(book)) {
        return book.currentPercent !== undefined && book.currentPercent >= 100;
      }
      return (
        book.currentMinutes !== undefined &&
        book.totalMinutes !== undefined &&
        book.currentMinutes >= book.totalMinutes
      );
  }
}

// Kombiniert Delta und Ziel in einer Zeile (z.B. "50/30 Seiten", "40%/25%",
// "2:15/1:30 Std") - fällt auf reine Delta-Anzeige zurück, wenn kein Ziel gesetzt ist.
export function formatDeltaWithGoal(book: ParticipantBook): string {
  switch (book.format) {
    case "physical": {
      if (book.goalPage === undefined || book.startPage === undefined) return formatDeltaProgress(book);
      const deltaPages = Math.max(0, (book.currentPage ?? 0) - book.startPage);
      const goalPages = book.goalPage - book.startPage;
      return `${deltaPages}/${goalPages} Seiten`;
    }
    case "ebook": {
      if (book.goalPercent === undefined || book.startPercent === undefined) return formatDeltaProgress(book);
      const deltaPercent = Math.max(0, (book.currentPercent ?? 0) - book.startPercent);
      const goalPercent = book.goalPercent - book.startPercent;
      return `${deltaPercent}%/${goalPercent}%`;
    }
    case "audiobook": {
      if (isAudiobookPercent(book)) {
        if (book.goalPercent === undefined || book.startPercent === undefined) return formatDeltaProgress(book);
        const deltaPercent = Math.max(0, (book.currentPercent ?? 0) - book.startPercent);
        const goalPercent = book.goalPercent - book.startPercent;
        return `${deltaPercent}%/${goalPercent}%`;
      }
      if (book.goalMinutes === undefined || book.startMinutes === undefined) return formatDeltaProgress(book);
      const deltaMinutes = Math.max(0, (book.currentMinutes ?? 0) - book.startMinutes);
      const goalMinutes = book.goalMinutes - book.startMinutes;
      return `${formatHM(deltaMinutes)}/${formatHM(goalMinutes)} Std`;
    }
  }
}

// Anzeige des AKTUELLEN Standes (für das private Teilnehmer-Panel), z.B.
// "180 / 400 Seiten", "45% (135/300 Seiten)", "2:15 / 8:30 Std",
// "45% (≈2:15 / 8:30 Std)" (Hörbuch im %-Modus).
export function formatCurrentProgress(book: ParticipantBook): string {
  switch (book.format) {
    case "physical":
      return `${book.currentPage} / ${book.totalPages} Seiten`;
    case "ebook": {
      const pages = book.totalPages ? Math.round(((book.currentPercent ?? 0) / 100) * book.totalPages) : 0;
      return `${book.currentPercent}% (${pages}/${book.totalPages} Seiten)`;
    }
    case "audiobook": {
      if (isAudiobookPercent(book)) {
        const minutes = book.totalMinutes ? Math.round(((book.currentPercent ?? 0) / 100) * book.totalMinutes) : 0;
        return `${book.currentPercent}% (≈${formatHM(minutes)} / ${formatHM(book.totalMinutes ?? 0)} Std)`;
      }
      return `${formatHM(book.currentMinutes ?? 0)} / ${formatHM(book.totalMinutes ?? 0)} Std`;
    }
  }
}

// Anzeige des in DIESEM SPRINT gemachten Fortschritts (Delta), z.B. für das
// Sprintende-Bild und die öffentliche Teilnehmerliste: "45 Seiten",
// "20% (60 Seiten)", "1:30 Std", "20% (≈1:42 Std)" (Hörbuch im %-Modus).
export function formatDeltaProgress(book: ParticipantBook): string {
  switch (book.format) {
    case "physical": {
      const delta = Math.max(0, (book.currentPage ?? 0) - (book.startPage ?? 0));
      return `${delta} Seiten`;
    }
    case "ebook": {
      const deltaPercent = Math.max(0, (book.currentPercent ?? 0) - (book.startPercent ?? 0));
      const deltaPages = book.totalPages ? Math.round((deltaPercent / 100) * book.totalPages) : 0;
      return `${deltaPercent}% (${deltaPages} Seiten)`;
    }
    case "audiobook": {
      if (isAudiobookPercent(book)) {
        const deltaPercent = Math.max(0, (book.currentPercent ?? 0) - (book.startPercent ?? 0));
        const deltaMinutes = book.totalMinutes ? Math.round((deltaPercent / 100) * book.totalMinutes) : 0;
        return `${deltaPercent}% (≈${formatHM(deltaMinutes)} Std)`;
      }
      const deltaMinutes = Math.max(0, (book.currentMinutes ?? 0) - (book.startMinutes ?? 0));
      return `${formatHM(deltaMinutes)} Std`;
    }
  }
}

// Anzeige des Ziels (falls gesetzt), z.B. "45 Seiten (bis Seite 250)",
// "20% (bis 65%)", "1:30 Std (bis 6:00 Std)". Gibt null zurück, wenn kein
// Ziel gesetzt wurde.
export function formatGoal(book: ParticipantBook): string | null {
  switch (book.format) {
    case "physical": {
      if (book.goalPage === undefined || book.startPage === undefined) return null;
      return `${book.goalPage - book.startPage} Seiten (bis Seite ${book.goalPage})`;
    }
    case "ebook": {
      if (book.goalPercent === undefined || book.startPercent === undefined) return null;
      return `${book.goalPercent - book.startPercent}% (bis ${book.goalPercent}%)`;
    }
    case "audiobook": {
      if (isAudiobookPercent(book)) {
        if (book.goalPercent === undefined || book.startPercent === undefined) return null;
        return `${book.goalPercent - book.startPercent}% (bis ${book.goalPercent}%)`;
      }
      if (book.goalMinutes === undefined || book.startMinutes === undefined) return null;
      return `${formatHM(book.goalMinutes - book.startMinutes)} Std (bis ${formatHM(book.goalMinutes)} Std)`;
    }
  }
}

// Beschreibung des Gesamtumfangs für Dropdown-Einträge in der Bibliotheks-Auswahl.
export function describeBookTotal(format: BookFormat, totalPages?: number, totalMinutes?: number): string {
  if (format === "audiobook") return `${formatHM(totalMinutes ?? 0)} Std`;
  return `${totalPages ?? 0} Seiten`;
}

export function formatLabel(format: BookFormat): string {
  switch (format) {
    case "physical":
      return "Physisch";
    case "ebook":
      return "Ebook";
    case "audiobook":
      return "Hörbuch";
  }
}

// Feld-Labels für die Modals, format-abhängig. Zentral hier statt in jedem
// Modal-Builder dupliziert, da dieselbe Logik an vielen Stellen gebraucht wird
// (Beitritt, Buchwechsel - jeweils neues & vorhandenes Buch).
// `percentMode` ist nur für audiobook relevant (Std:Min vs. %-Eingabe).
export function getCurrentFieldLabel(format: BookFormat, percentMode = false): string {
  switch (format) {
    case "physical":
      return "Aktuelle Seite";
    case "ebook":
      return "Aktueller Fortschritt in % (0-100)";
    case "audiobook":
      return percentMode ? "Aktueller Fortschritt in % (0-100)" : "Aktuelle Position (Std:Min, z.B. 2:30)";
  }
}

// Label für "Startwert korrigieren" - bewusst andere Formulierung als
// getCurrentFieldLabel, damit klar ist: das setzt NICHT nur den aktuellen
// Stand, sondern auch den Startpunkt (siehe sprintService.fixBookStart).
export function getFixStartFieldLabel(format: BookFormat, percentMode = false): string {
  switch (format) {
    case "physical":
      return "Neue Startseite (setzt auch aktuelle Seite)";
    case "ebook":
      return "Neuer Start-% (setzt auch aktuellen %)";
    case "audiobook":
      return percentMode
        ? "Neuer Start-% (setzt auch aktuellen %)"
        : "Neue Startzeit (setzt auch aktuelle Zeit)";
  }
}

export function getOldCurrentFieldLabel(format: BookFormat, percentMode = false): string {
  switch (format) {
    case "physical":
      return "Aktuelle Seite (bisheriges Buch)";
    case "ebook":
      return "Fortschritt % (bisheriges Buch)";
    case "audiobook":
      return percentMode ? "Fortschritt % (bisheriges Buch)" : "Position (bisher, Std:Min)";
  }
}

// Gesamtumfang wird bei Hörbüchern IMMER in Std:Min angegeben (unabhängig
// vom Tracking-Modus) - nur der FORTSCHRITT wird ggf. in % erfasst.
export function getTotalFieldLabel(format: BookFormat): string {
  return format === "audiobook" ? "Gesamtdauer (Std:Min, z.B. 8:30)" : "Gesamtseitenzahl";
}

// Kurzform "Anzahl" vs. "@Zielwert" - dieselbe Beschriftung für alle Formate,
// da das @-Präfix-Muster überall gleich funktioniert.
export function getGoalFieldLabel(format: BookFormat, percentMode = false): string {
  switch (format) {
    case "physical":
      return "Ziel: Anzahl Seiten oder @Zielseite";
    case "ebook":
      return "Ziel: Anzahl % oder @Ziel-%";
    case "audiobook":
      return percentMode ? "Ziel: Anzahl % oder @Ziel-%" : "Ziel: Dauer oder @Zielzeit (Std:Min)";
  }
}

// Platzhaltertext fürs Ziel-Feld, zeigt beide Eingabe-Varianten als Beispiel.
export function getGoalFieldPlaceholder(format: BookFormat, percentMode = false): string {
  if (format === "audiobook" && !percentMode) return "z.B. 1:30 oder @6:00";
  return "z.B. 50 oder @300";
}

export interface ParsedGoal {
  delta?: number; // "wie viel lesen/hören" - wird zum Startwert addiert
  absolute?: number; // "@Zielwert" - wird direkt als Ziel übernommen
}

/**
 * Parst die Ziel-Eingabe. Ein führendes "@" bedeutet "das ist der absolute
 * Zielwert" (z.B. "@300" = Zielseite 300), ohne "@" wird die Zahl als
 * Anzahl/Delta interpretiert (z.B. "50" = 50 Seiten lesen, ausgehend vom
 * aktuellen Stand). Gibt null zurück bei ungültiger Eingabe.
 */
export function parseGoalValue(format: BookFormat, rawValue: string, percentMode = false): ParsedGoal | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return {};

  if (trimmed.startsWith("@")) {
    const absolute = parseFormatValue(format, trimmed.slice(1), percentMode);
    if (absolute === null) return null;
    return { absolute };
  }

  const delta = parseFormatValuePositive(format, trimmed, percentMode);
  if (delta === null) return null;
  return { delta };
}

/**
 * Formatiert einen gespeicherten Rohwert (Seite/Prozent/Minute) als String
 * fürs Vorausfüllen eines Modal-Felds - das Gegenstück zu parseFormatValue.
 * audiobook ohne percentMode -> "H:MM", sonst einfach die Zahl.
 */
export function formatValueForInput(format: BookFormat, value: number, percentMode = false): string {
  if (format === "audiobook" && !percentMode) return formatHM(value);
  return String(value);
}

/**
 * Parst einen Eingabewert (current/goal) format-abhängig: physical/ebook ->
 * Ganzzahl, audiobook -> "H:MM" in Minuten (oder Ganzzahl-Prozent, falls
 * percentMode aktiv ist).
 */
export function parseFormatValue(format: BookFormat, value: string, percentMode = false): number | null {
  if (format === "audiobook" && !percentMode) return parseDurationHM(value);
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

// Wie parseFormatValue, aber verlangt einen Wert > 0 (für Gesamtseitenzahl/
// -dauer, wo 0 keinen Sinn ergibt). Für "total" ist percentMode nie relevant
// (Gesamtdauer ist immer Std:Min), Default false ist daher hier korrekt.
export function parseFormatValuePositive(format: BookFormat, value: string, percentMode = false): number | null {
  const parsed = parseFormatValue(format, value, percentMode);
  return parsed !== null && parsed > 0 ? parsed : null;
}
