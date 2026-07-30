"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnfinishedBooks = getUnfinishedBooks;
exports.findOrCreateBook = findOrCreateBook;
exports.markBookFinished = markBookFinished;
const Book_1 = require("../database/models/Book");
// Discord erlaubt max. 25 Optionen pro Select-Menü. Ein Platz bleibt für die
// "Neues Buch"-Option reserviert (siehe buildBookSelectOptions).
const MAX_BOOKS_IN_SELECT = 24;
/**
 * Lädt die unbeendeten Bücher eines Nutzers, neueste zuerst.
 * Wird beim Beitritt/Buchwechsel genutzt, um eine Dropdown-Auswahl zu bauen,
 * damit man ein bereits begonnenes Buch fortsetzen kann, ohne Titel/Umfang
 * erneut eintippen zu müssen.
 */
async function getUnfinishedBooks(userId, guildId) {
    return Book_1.Book.find({ userId, guildId, isFinished: false })
        .sort({ updatedAt: -1 })
        .limit(MAX_BOOKS_IN_SELECT);
}
/**
 * Sucht ein vorhandenes, noch nicht beendetes Buch mit exakt diesem Titel
 * in der Bibliothek des Nutzers, oder legt ein neues an.
 * Groß-/Kleinschreibung wird beim Vergleich ignoriert, damit "Harry Potter"
 * und "harry potter" nicht als zwei verschiedene Bücher gelten.
 *
 * @param totalValue Gesamtseitenzahl (physical/ebook) oder Gesamtminuten (audiobook)
 */
async function findOrCreateBook(userId, guildId, title, format, totalValue) {
    const existing = await Book_1.Book.findOne({
        userId,
        guildId,
        isFinished: false,
        title: { $regex: `^${escapeRegex(title)}$`, $options: "i" },
    });
    if (existing) {
        // Format/Gesamtumfang könnten sich geändert haben (z.B. Tippfehler korrigiert).
        existing.format = format;
        if (format === "audiobook") {
            existing.totalMinutes = totalValue;
            existing.totalPages = undefined;
        }
        else {
            existing.totalPages = totalValue;
            existing.totalMinutes = undefined;
        }
        return existing;
    }
    return Book_1.Book.create({
        userId,
        guildId,
        title,
        format,
        totalPages: format === "audiobook" ? undefined : totalValue,
        totalMinutes: format === "audiobook" ? totalValue : undefined,
    });
}
/**
 * Markiert ein Buch als fertiggelesen. Wird vom SprintService aufgerufen,
 * sobald der Fortschritt 100% erreicht (siehe bookProgress.isBookComplete).
 */
async function markBookFinished(bookId) {
    await Book_1.Book.findByIdAndUpdate(bookId, {
        isFinished: true,
        finishedAt: new Date(),
    });
}
// Verhindert, dass Sonderzeichen im Buchtitel den RegEx-Vergleich oben brechen.
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
