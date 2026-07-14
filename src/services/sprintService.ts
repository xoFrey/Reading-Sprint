import { Sprint, ISprint } from "../database/models/Sprint";
import { SprintParticipant, ISprintParticipant } from "../database/models/SprintParticipant";
import { User, IUser } from "../database/models/User";
import { Guild } from "../database/models/Guild";
import { ParticipantBook } from "../types";
import { resolveXPConfig } from "../config/xpConfig";
import { GRACE_PERIOD_MINUTES } from "../config/constants";
import { calculateSprintXP, applyXPGain } from "../xp/xpService";
import { updateStreak } from "./streakService";
import { findOrCreateBook, markBookFinished } from "./bookService";

// Ergebnis eines einzelnen Teilnehmers, wird für das Abschluss-Leaderboard genutzt.
export interface ParticipantResult {
  userId: string;
  placement: number; // wird erst nach dem Sortieren aller Ergebnisse gesetzt
  books: ParticipantBook[];
  totalPagesRead: number;
  goalReached: boolean;
  xpEarned: number;
  leveledUp: boolean;
  newLevel: number;
}

/**
 * Startet einen neuen aktiven Sprint (Button "Start" oder automatisch
 * durch den Scheduler-Job bei einem geplanten Sprint).
 */
export async function startSprint(
  guildId: string,
  channelId: string,
  createdBy: string,
  durationMinutes: number
): Promise<ISprint> {
  const startTime = new Date();

  return Sprint.create({
    guildId,
    channelId,
    createdBy,
    duration: durationMinutes,
    startTime,
    status: "active",
  });
}

/**
 * Lässt einen Nutzer einem Sprint beitreten und legt sein erstes Buch an.
 * findOrCreateBook stellt sicher, dass bereits bekannte Bücher wiederverwendet werden.
 */
export async function joinSprint(
  sprintId: string,
  userId: string,
  guildId: string,
  bookTitle: string,
  currentPage: number,
  totalPages: number,
  goalPage?: number
): Promise<ISprintParticipant> {
  const book = await findOrCreateBook(userId, guildId, bookTitle, totalPages);

  const initialBook: ParticipantBook = {
    title: book.title,
    startPage: currentPage,
    currentPage,
    totalPages,
    goalPage,
    isFinished: false,
  };

  return SprintParticipant.create({
    sprintId,
    userId,
    guildId,
    books: [initialBook],
  });
}

/**
 * Fügt ein weiteres Buch hinzu (Button "Buch wechseln"). Das neue Buch wird
 * ans Ende des Arrays gehängt und gilt damit als das "aktuelle" Buch
 * (siehe getCurrentBook) - so bleiben abgeschlossene/vorherige Bücher als Historie erhalten.
 */
export async function switchBook(
  participantId: string,
  userId: string,
  guildId: string,
  bookTitle: string,
  currentPage: number,
  totalPages: number,
  goalPage?: number
): Promise<ISprintParticipant | null> {
  const book = await findOrCreateBook(userId, guildId, bookTitle, totalPages);

  const newBook: ParticipantBook = {
    title: book.title,
    startPage: currentPage,
    currentPage,
    totalPages,
    goalPage,
    isFinished: false,
  };

  return SprintParticipant.findByIdAndUpdate(
    participantId,
    { $push: { books: newBook } },
    { new: true }
  );
}

// Das zuletzt hinzugefügte Buch gilt als das aktuell gelesene.
export function getCurrentBook(participant: ISprintParticipant): ParticipantBook | undefined {
  return participant.books[participant.books.length - 1];
}

/**
 * Aktualisiert die aktuelle Seite im gerade aktiven Buch des Teilnehmers.
 * Markiert das Buch automatisch als fertig, wenn currentPage die Gesamtseitenzahl erreicht.
 */
export async function updateCurrentPage(
  participant: ISprintParticipant,
  newCurrentPage: number
): Promise<void> {
  const book = getCurrentBook(participant);
  if (!book) return;

  book.currentPage = newCurrentPage;

  if (newCurrentPage >= book.totalPages && !book.isFinished) {
    book.isFinished = true;
    // Buch auch in der persönlichen Bibliothek als fertig markieren.
    const libraryBook = await findOrCreateBook(
      participant.userId,
      participant.guildId,
      book.title,
      book.totalPages
    );
    await markBookFinished(libraryBook.id);
  }

  await participant.save();
}

export async function setParticipantStatus(
  participantId: string,
  status: "active" | "paused" | "left"
): Promise<void> {
  const update: Record<string, unknown> = { status };
  if (status === "left") update.leftAt = new Date();

  await SprintParticipant.findByIdAndUpdate(participantId, update);
}

/**
 * Beendet die aktive Lesephase eines Sprints, wertet aber noch NICHT aus.
 * Stattdessen startet eine Kulanzzeit (Standard: 10 Minuten), in der
 * Teilnehmer ihre letzte Seite noch nachtragen können - typisch, wenn man
 * genau am Sprintende noch mittendrin liest. finalizeSprint() übernimmt
 * danach die eigentliche Auswertung (siehe Scheduler-Job).
 */
export async function startGracePeriod(sprintId: string): Promise<ISprint> {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint) throw new Error("Sprint nicht gefunden.");

  sprint.status = "grace";
  sprint.graceEndTime = new Date(Date.now() + GRACE_PERIOD_MINUTES * 60_000);
  await sprint.save();

  return sprint;
}

/**
 * Wertet einen Sprint final aus: berechnet für jeden Teilnehmer die gelesenen
 * Seiten, vergibt XP, aktualisiert Streak & Nutzerstatistiken und liefert eine
 * sortierte Ergebnisliste fürs öffentliche Abschluss-Leaderboard zurück.
 *
 * Wird sowohl nach Ablauf der Kulanzzeit (normaler Ablauf) als auch beim
 * manuellen Admin-Abbruch (End-Button, überspringt die Kulanzzeit) aufgerufen.
 *
 * Alle DB-Schreibvorgänge pro Teilnehmer sind bewusst sequenziell (nicht Promise.all),
 * um die Datenbank bei sehr großen Sprints nicht mit parallelen Writes zu überlasten.
 */
export async function finalizeSprint(sprintId: string): Promise<ParticipantResult[]> {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint) throw new Error("Sprint nicht gefunden.");

  sprint.status = "ended";
  sprint.endTime = new Date();
  await sprint.save();

  const guildConfig = await Guild.findOne({ guildId: sprint.guildId });
  const xpConfig = resolveXPConfig(guildConfig?.xpConfig);

  const participants = await SprintParticipant.find({
    sprintId,
    status: { $ne: "left" },
  });

  const results: ParticipantResult[] = [];

  for (const participant of participants) {
    const totalPagesRead = participant.books.reduce(
      (sum, book) => sum + Math.max(0, book.currentPage - book.startPage),
      0
    );
    const goalReached = participant.books.some(
      (book) => book.goalPage !== undefined && book.currentPage >= book.goalPage
    );
    const finishedBooksCount = participant.books.filter((book) => book.isFinished).length;

    let user = await User.findOne({ discordId: participant.userId, guildId: participant.guildId });
    if (!user) {
      user = await User.create({ discordId: participant.userId, guildId: participant.guildId });
    }

    // Streak MUSS vor der XP-Berechnung aktualisiert werden, da der neue
    // Streak-Wert direkt in den Streak-Bonus der XP einfließt.
    updateStreak(user, totalPagesRead);

    const xpEarned = calculateSprintXP(xpConfig, {
      pagesRead: totalPagesRead,
      goalReached,
      finishedBooksCount,
      currentStreak: user.currentStreak,
    });

    const { leveledUp, newLevel } = applyXPGain(user, xpEarned);

    user.totalPagesRead += totalPagesRead;
    user.totalBooksFinished += finishedBooksCount;
    user.totalSprintsCompleted += 1;

    await user.save();

    participant.xpEarned = xpEarned;
    await participant.save();

    results.push({
      userId: participant.userId,
      placement: 0, // wird unten gesetzt
      books: participant.books,
      totalPagesRead,
      goalReached,
      xpEarned,
      leveledUp,
      newLevel,
    });
  }

  // Platzierung nach gelesenen Gesamtseiten, absteigend.
  results.sort((a, b) => b.totalPagesRead - a.totalPagesRead);
  results.forEach((result, index) => (result.placement = index + 1));

  return results;
}
