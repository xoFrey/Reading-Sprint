import { Book, IBook } from "../database/models/Book";
import { BookFormat } from "../types";

// Discord erlaubt max. 25 Optionen pro Select-Menü. Ein Platz bleibt für die
// "Neues Buch"-Option reserviert (siehe buildBookSelectOptions).
const MAX_BOOKS_IN_SELECT = 24;

/**
 * Lädt die unbeendeten Bücher eines Nutzers, neueste zuerst.
 * Wird beim Beitritt/Buchwechsel genutzt, um eine Dropdown-Auswahl zu bauen,
 * damit man ein bereits begonnenes Buch fortsetzen kann, ohne Titel/Umfang
 * erneut eintippen zu müssen.
 */
export async function getUnfinishedBooks(userId: string, guildId: string): Promise<IBook[]> {
  return Book.find({ userId, guildId, isFinished: false })
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
 * @param audiobookPercentMode nur relevant für format="audiobook": Fortschritt
 *   wird über % statt Std:Min erfasst (z.B. weil die Hörbuch-App nur %
 *   Fortschritt zeigt, keine genaue Position)
 * @param lastKnownProgress zuletzt bekannter Fortschritt (Seite/Prozent/
 *   Minute) - wird gespeichert, damit das "aktuelle Seite"-Feld beim
 *   nächsten Sprint mit diesem Buch vorausgefüllt werden kann. Wird nur
 *   gesetzt, wenn explizit übergeben (undefined lässt den bisherigen Wert
 *   unangetastet).
 */
export async function findOrCreateBook(
  userId: string,
  guildId: string,
  title: string,
  format: BookFormat,
  totalValue: number,
  audiobookPercentMode?: boolean,
  lastKnownProgress?: number
): Promise<IBook> {
  const existing = await Book.findOne({
    userId,
    guildId,
    isFinished: false,
    title: { $regex: `^${escapeRegex(title)}$`, $options: "i" },
  });

  if (existing) {
    // Format/Gesamtumfang könnten sich geändert haben (z.B. Tippfehler korrigiert).
    existing.format = format;
    existing.audiobookPercentMode = format === "audiobook" ? audiobookPercentMode : undefined;
    if (format === "audiobook") {
      existing.totalMinutes = totalValue;
      existing.totalPages = undefined;
    } else {
      existing.totalPages = totalValue;
      existing.totalMinutes = undefined;
    }
    if (lastKnownProgress !== undefined) existing.lastKnownProgress = lastKnownProgress;
    await existing.save();
    return existing;
  }

  return Book.create({
    userId,
    guildId,
    title,
    format,
    totalPages: format === "audiobook" ? undefined : totalValue,
    totalMinutes: format === "audiobook" ? totalValue : undefined,
    audiobookPercentMode: format === "audiobook" ? audiobookPercentMode : undefined,
    lastKnownProgress,
  });
}

/**
 * Markiert ein Buch als fertiggelesen. Wird vom SprintService aufgerufen,
 * sobald der Fortschritt 100% erreicht (siehe bookProgress.isBookComplete).
 */
export async function markBookFinished(bookId: string): Promise<void> {
  await Book.findByIdAndUpdate(bookId, {
    isFinished: true,
    finishedAt: new Date(),
  });
}

// Verhindert, dass Sonderzeichen im Buchtitel den RegEx-Vergleich oben brechen.
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
