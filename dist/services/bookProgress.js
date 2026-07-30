"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUDIOBOOK_MINUTES_PER_PAGE = void 0;
exports.formatHM = formatHM;
exports.parseDurationHM = parseDurationHM;
exports.getPagesEquivalent = getPagesEquivalent;
exports.isBookGoalReached = isBookGoalReached;
exports.isBookComplete = isBookComplete;
exports.formatDeltaWithGoal = formatDeltaWithGoal;
exports.formatCurrentProgress = formatCurrentProgress;
exports.formatDeltaProgress = formatDeltaProgress;
exports.formatGoal = formatGoal;
exports.describeBookTotal = describeBookTotal;
exports.formatLabel = formatLabel;
exports.getCurrentFieldLabel = getCurrentFieldLabel;
exports.getOldCurrentFieldLabel = getOldCurrentFieldLabel;
exports.getTotalFieldLabel = getTotalFieldLabel;
exports.getGoalFieldLabel = getGoalFieldLabel;
exports.parseFormatValue = parseFormatValue;
exports.parseFormatValuePositive = parseFormatValuePositive;
// Umrechnungsfaktor Hörbuch-Minuten -> Seiten-Äquivalent für die XP-Berechnung.
// ~150 Wörter/Minute Vorlesegeschwindigkeit vs. ~270 Wörter/Buchseite ergibt
// grob 0,45 Seiten pro gehörter Minute (≈27 Seiten/Stunde). Konfigurierbar,
// falls sich das in der Praxis als zu großzügig/knapp herausstellt.
exports.AUDIOBOOK_MINUTES_PER_PAGE = 0.45;
/**
 * Formatiert Minuten als "H:MM" fürs Eintippen in Modals (z.B. "2:30").
 * Bewusst anders als utils/format.ts#formatMinutes ("2 Std 30 Min"), das ist
 * für die Anzeige gedacht, dieses Format hier fürs kompakte Eintippen.
 */
function formatHM(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${String(minutes).padStart(2, "0")}`;
}
/**
 * Parst eine Zeitangabe im Format "H:MM" oder "HH:MM" (z.B. "2:30" = 150 Minuten).
 * Gibt null zurück bei ungültigem Format oder Minuten >= 60.
 */
function parseDurationHM(input) {
    const match = input.trim().match(/^(\d{1,4}):(\d{1,2})$/);
    if (!match)
        return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (minutes >= 60)
        return null;
    return hours * 60 + minutes;
}
/**
 * Berechnet, wie viele Seiten in diesem Sprint für dieses Buch gelesen wurden -
 * unabhängig vom Format, immer als "Seiten-Äquivalent" (Grundlage für XP,
 * Leaderboard-Ranking und das Sprintende-"Gesamt"-Feld). Läuft komplett im
 * Hintergrund; die Anzeige bleibt trotzdem format-gerecht (siehe unten).
 */
function getPagesEquivalent(book) {
    switch (book.format) {
        case "physical": {
            if (book.currentPage == null || book.startPage == null)
                return 0;
            return Math.max(0, book.currentPage - book.startPage);
        }
        case "ebook": {
            if (book.currentPercent == null || book.startPercent == null || !book.totalPages)
                return 0;
            const percentRead = Math.max(0, book.currentPercent - book.startPercent) / 100;
            return percentRead * book.totalPages;
        }
        case "audiobook": {
            if (book.currentMinutes == null || book.startMinutes == null)
                return 0;
            const minutesListened = Math.max(0, book.currentMinutes - book.startMinutes);
            return minutesListened * exports.AUDIOBOOK_MINUTES_PER_PAGE;
        }
    }
}
/**
 * Prüft, ob das (optionale) Sprint-Ziel für dieses Buch erreicht wurde.
 * Ein Ziel zählt nur, wenn es beim Sprintstart noch NICHT bereits erfüllt
 * war (sonst wäre "0 gelesen, Ziel schon vorher erreicht" fälschlich "erreicht").
 */
function isBookGoalReached(book) {
    switch (book.format) {
        case "physical":
            return (book.goalPage !== undefined &&
                book.startPage !== undefined &&
                book.currentPage !== undefined &&
                book.startPage < book.goalPage &&
                book.currentPage >= book.goalPage);
        case "ebook":
            return (book.goalPercent !== undefined &&
                book.startPercent !== undefined &&
                book.currentPercent !== undefined &&
                book.startPercent < book.goalPercent &&
                book.currentPercent >= book.goalPercent);
        case "audiobook":
            return (book.goalMinutes !== undefined &&
                book.startMinutes !== undefined &&
                book.currentMinutes !== undefined &&
                book.startMinutes < book.goalMinutes &&
                book.currentMinutes >= book.goalMinutes);
    }
}
/**
 * True, sobald der aktuelle Fortschritt das Ende des Buchs erreicht hat
 * (100% bzw. letzte Seite/Minute) - unabhängig vom Ziel.
 */
function isBookComplete(book) {
    switch (book.format) {
        case "physical":
            return book.currentPage !== undefined && book.totalPages !== undefined && book.currentPage >= book.totalPages;
        case "ebook":
            return book.currentPercent !== undefined && book.currentPercent >= 100;
        case "audiobook":
            return (book.currentMinutes !== undefined &&
                book.totalMinutes !== undefined &&
                book.currentMinutes >= book.totalMinutes);
    }
}
// Kombiniert Delta und Ziel in einer Zeile (z.B. "50/30 Seiten", "40%/25%",
// "2:15/1:30 Std") - fällt auf reine Delta-Anzeige zurück, wenn kein Ziel gesetzt ist.
function formatDeltaWithGoal(book) {
    switch (book.format) {
        case "physical": {
            if (book.goalPage === undefined || book.startPage === undefined)
                return formatDeltaProgress(book);
            const deltaPages = Math.max(0, (book.currentPage ?? 0) - book.startPage);
            const goalPages = book.goalPage - book.startPage;
            return `${deltaPages}/${goalPages} Seiten`;
        }
        case "ebook": {
            if (book.goalPercent === undefined || book.startPercent === undefined)
                return formatDeltaProgress(book);
            const deltaPercent = Math.max(0, (book.currentPercent ?? 0) - book.startPercent);
            const goalPercent = book.goalPercent - book.startPercent;
            return `${deltaPercent}%/${goalPercent}%`;
        }
        case "audiobook": {
            if (book.goalMinutes === undefined || book.startMinutes === undefined)
                return formatDeltaProgress(book);
            const deltaMinutes = Math.max(0, (book.currentMinutes ?? 0) - book.startMinutes);
            const goalMinutes = book.goalMinutes - book.startMinutes;
            return `${formatHM(deltaMinutes)}/${formatHM(goalMinutes)} Std`;
        }
    }
}
// Anzeige des AKTUELLEN Standes (für das private Teilnehmer-Panel), z.B.
// "180 / 400 Seiten", "45% (135/300 Seiten)", "2:15 / 8:30 Std".
function formatCurrentProgress(book) {
    switch (book.format) {
        case "physical":
            return `${book.currentPage} / ${book.totalPages} Seiten`;
        case "ebook": {
            const pages = book.totalPages ? Math.round(((book.currentPercent ?? 0) / 100) * book.totalPages) : 0;
            return `${book.currentPercent}% (${pages}/${book.totalPages} Seiten)`;
        }
        case "audiobook":
            return `${formatHM(book.currentMinutes ?? 0)} / ${formatHM(book.totalMinutes ?? 0)} Std`;
    }
}
// Anzeige des in DIESEM SPRINT gemachten Fortschritts (Delta), z.B. für das
// Sprintende-Bild und die öffentliche Teilnehmerliste: "45 Seiten",
// "20% (60 Seiten)", "1:30 Std".
function formatDeltaProgress(book) {
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
            const deltaMinutes = Math.max(0, (book.currentMinutes ?? 0) - (book.startMinutes ?? 0));
            return `${formatHM(deltaMinutes)} Std`;
        }
    }
}
// Anzeige des Ziels (falls gesetzt), z.B. "45 Seiten (bis Seite 250)",
// "20% (bis 65%)", "1:30 Std (bis 6:00 Std)". Gibt null zurück, wenn kein
// Ziel gesetzt wurde.
function formatGoal(book) {
    switch (book.format) {
        case "physical": {
            if (book.goalPage === undefined || book.startPage === undefined)
                return null;
            return `${book.goalPage - book.startPage} Seiten (bis Seite ${book.goalPage})`;
        }
        case "ebook": {
            if (book.goalPercent === undefined || book.startPercent === undefined)
                return null;
            return `${book.goalPercent - book.startPercent}% (bis ${book.goalPercent}%)`;
        }
        case "audiobook": {
            if (book.goalMinutes === undefined || book.startMinutes === undefined)
                return null;
            return `${formatHM(book.goalMinutes - book.startMinutes)} Std (bis ${formatHM(book.goalMinutes)} Std)`;
        }
    }
}
// Beschreibung des Gesamtumfangs für Dropdown-Einträge in der Bibliotheks-Auswahl.
function describeBookTotal(format, totalPages, totalMinutes) {
    if (format === "audiobook")
        return `${formatHM(totalMinutes ?? 0)} Std`;
    return `${totalPages ?? 0} Seiten`;
}
function formatLabel(format) {
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
function getCurrentFieldLabel(format) {
    switch (format) {
        case "physical":
            return "Aktuelle Seite";
        case "ebook":
            return "Aktueller Fortschritt in % (0-100)";
        case "audiobook":
            return "Aktuelle Position (Std:Min, z.B. 2:30)";
    }
}
function getOldCurrentFieldLabel(format) {
    switch (format) {
        case "physical":
            return "Aktuelle Seite (bisheriges Buch)";
        case "ebook":
            return "Aktueller Fortschritt in % (bisheriges Buch)";
        case "audiobook":
            return "Aktuelle Position (bisheriges Hörbuch, Std:Min)";
    }
}
function getTotalFieldLabel(format) {
    return format === "audiobook" ? "Gesamtdauer (Std:Min, z.B. 8:30)" : "Gesamtseitenzahl";
}
function getGoalFieldLabel(format) {
    switch (format) {
        case "physical":
            return "Seitenziel: wie viele Seiten? (optional)";
        case "ebook":
            return "Zielfortschritt: wie viel %? (optional)";
        case "audiobook":
            return "Zielzeit: wie lange hören? (Std:Min, optional)";
    }
}
/**
 * Parst einen Eingabewert (current/total/goal) format-abhängig:
 * physical/ebook -> Ganzzahl, audiobook -> "H:MM" in Minuten umgerechnet.
 */
function parseFormatValue(format, value) {
    if (format === "audiobook")
        return parseDurationHM(value);
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
// Wie parseFormatValue, aber verlangt einen Wert > 0 (für Gesamtseitenzahl/
// -dauer, wo 0 keinen Sinn ergibt).
function parseFormatValuePositive(format, value) {
    const parsed = parseFormatValue(format, value);
    return parsed !== null && parsed > 0 ? parsed : null;
}
