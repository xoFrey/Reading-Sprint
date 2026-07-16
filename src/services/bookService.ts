import { Book, IBook } from "../database/models/Book";

// Discord erlaubt max. 25 Optionen pro Select-Menü. Ein Platz bleibt für die
// "Neues Buch"-Option reserviert (siehe buildBookSelectOptions).
const MAX_BOOKS_IN_SELECT = 24;

/**
 * Lädt die unbeendeten Bücher eines Nutzers, neueste zuerst.
 * Wird beim Beitritt/Buchwechsel genutzt, um eine Dropdown-Auswahl zu bauen,
 * damit man ein bereits begonnenes Buch fortsetzen kann, ohne Titel/Seitenzahl
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
 */
export async function findOrCreateBook(
  userId: string,
  guildId: string,
  title: string,
  totalPages: number
): Promise<IBook> {
  const existing = await Book.findOne({
    userId,
    guildId,
    isFinished: false,
    title: { $regex: `^${escapeRegex(title)}$`, $options: "i" },
  });

  if (existing) {
    // Gesamtseitenzahl könnte sich geändert haben (z.B. Tippfehler korrigiert).
    existing.totalPages = totalPages;
    return existing;
  }

  return Book.create({ userId, guildId, title, totalPages });
}

/**
 * Markiert ein Buch als fertiggelesen. Wird vom SprintService aufgerufen,
 * sobald currentPage >= totalPages ist.
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
