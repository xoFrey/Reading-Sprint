import { Sprint, ISprint } from "../database/models/Sprint";
import { SprintParticipant, ISprintParticipant } from "../database/models/SprintParticipant";
import { User, IUser } from "../database/models/User";
import { Guild } from "../database/models/Guild";
import { ParticipantBook, BookFormat } from "../types";
import { resolveXPConfig } from "../config/xpConfig";
import { GRACE_PERIOD_MINUTES } from "../config/constants";
import { calculateSprintXP, applyXPGain } from "../xp/xpService";
import { calculateLevelProgress } from "../xp/levelCurve";
import { updateStreak } from "./streakService";
import { findOrCreateBook, markBookFinished } from "./bookService";
import { getPagesEquivalent, isBookGoalReached, isBookComplete } from "./bookProgress";

// Ergebnis eines einzelnen Teilnehmers, wird für das Abschluss-Leaderboard genutzt.
export interface ParticipantResult {
  userId: string;
  placement: number; // wird erst nach dem Sortieren aller Ergebnisse gesetzt
  books: ParticipantBook[];
  totalPagesRead: number; // Seiten-Äquivalent über ALLE Bücher/Formate hinweg (Hintergrundberechnung)
  goalReached: boolean;
  xpEarned: number;
  leveledUp: boolean;
  newLevel: number;
  leftEarly: boolean; // true, wenn der Teilnehmer den Sprint vorzeitig verlassen hat
  minutesInSprint: number; // Dauer der tatsächlichen Teilnahme
  currentLevelXP: number; // XP-Fortschritt im NEUEN Level (nach der Vergabe)
  xpForNextLevel: number; // benötigte XP fürs nächste Level (nach der Vergabe)
}

// Eingabedaten für ein neu eingetragenes Buch (Beitritt oder Buchwechsel),
// format-agnostisch: `current`/`total`/`goalDelta` bedeuten je nach `format`
// unterschiedliche Einheiten (Seite / Prozent / Minute) - siehe bookProgress.ts.
export interface NewBookInput {
  title: string;
  format: BookFormat;
  current: number; // Seite | Prozent (0-100) | Minute
  total: number; // Gesamtseiten (physical/ebook) | Gesamtminuten (audiobook)
  goalDelta?: number; // "wie viel lesen/hören" - wird zum Startwert addiert
  goalAbsolute?: number; // "@Zielwert" - wird direkt als Ziel übernommen (Vorrang vor goalDelta)
  audiobookPercentMode?: boolean; // nur für format="audiobook": Fortschritt über % statt Std:Min
}

// Berechnet den absoluten Zielwert aus goalAbsolute (Vorrang) oder goalDelta
// (relativ zum Startwert). undefined, falls kein Ziel gesetzt wurde.
function resolveGoal(input: NewBookInput): number | undefined {
  if (input.goalAbsolute !== undefined) return input.goalAbsolute;
  if (input.goalDelta) return input.current + input.goalDelta;
  return undefined;
}

// Baut ein ParticipantBook-Sub-Dokument aus den format-agnostischen Eingabedaten.
function buildParticipantBook(input: NewBookInput): ParticipantBook {
  const book: ParticipantBook = { title: input.title, format: input.format, isFinished: false };
  const goal = resolveGoal(input);

  switch (input.format) {
    case "physical":
      book.totalPages = input.total;
      book.startPage = input.current;
      book.currentPage = input.current;
      if (goal !== undefined) book.goalPage = goal;
      break;
    case "ebook":
      book.totalPages = input.total;
      book.startPercent = input.current;
      book.currentPercent = input.current;
      if (goal !== undefined) book.goalPercent = goal;
      break;
    case "audiobook":
      book.totalMinutes = input.total;
      book.audiobookPercentMode = input.audiobookPercentMode;
      if (input.audiobookPercentMode) {
        book.startPercent = input.current;
        book.currentPercent = input.current;
        if (goal !== undefined) book.goalPercent = goal;
      } else {
        book.startMinutes = input.current;
        book.currentMinutes = input.current;
        if (goal !== undefined) book.goalMinutes = goal;
      }
      break;
  }

  return book;
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
  input: NewBookInput
): Promise<ISprintParticipant> {
  const book = await findOrCreateBook(
    userId,
    guildId,
    input.title,
    input.format,
    input.total,
    input.audiobookPercentMode,
    input.current
  );

  const initialBook = buildParticipantBook({ ...input, title: book.title });

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
  input: NewBookInput
): Promise<ISprintParticipant | null> {
  const book = await findOrCreateBook(
    userId,
    guildId,
    input.title,
    input.format,
    input.total,
    input.audiobookPercentMode,
    input.current
  );

  const newBook = buildParticipantBook({ ...input, title: book.title });

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
 * Aktualisiert den Fortschritt im gerade aktiven Buch des Teilnehmers -
 * format-agnostisch: `newValue` ist eine Seite (physical), ein Prozentwert
 * (ebook) oder eine Minutenzahl (audiobook), je nachdem was das Buchformat ist.
 * Markiert das Buch automatisch als fertig, sobald 100% erreicht sind.
 */
export async function updateBookProgress(
  participant: ISprintParticipant,
  newValue: number
): Promise<void> {
  const book = getCurrentBook(participant);
  if (!book) return;

  switch (book.format) {
    case "physical":
      book.currentPage = newValue;
      break;
    case "ebook":
      book.currentPercent = newValue;
      break;
    case "audiobook":
      if (book.audiobookPercentMode) {
        book.currentPercent = newValue;
      } else {
        book.currentMinutes = newValue;
      }
      break;
  }

  // Bibliotheks-Eintrag IMMER mit dem neuen Stand aktualisieren (nicht nur
  // beim Fertigstellen), damit "aktuelle Seite" beim nächsten Sprint mit
  // diesem Buch vorausgefüllt werden kann (siehe joinBookSelect.ts).
  const totalValue = book.format === "audiobook" ? book.totalMinutes! : book.totalPages!;
  const libraryBook = await findOrCreateBook(
    participant.userId,
    participant.guildId,
    book.title,
    book.format,
    totalValue,
    book.audiobookPercentMode,
    newValue
  );

  if (isBookComplete(book) && !book.isFinished) {
    book.isFinished = true;
    // Buch auch in der persönlichen Bibliothek als fertig markieren.
    await markBookFinished(libraryBook.id);
  }

  await participant.save();
}

/**
 * Korrigiert den STARTWERT des aktuell gelesenen Buchs (nicht nur den
 * aktuellen Stand wie updateBookProgress) - setzt beide auf denselben neuen
 * Wert. Wichtig, falls z.B. bei Auto-Join (vorregistrierte Nutzer, siehe
 * jobs/scheduler.ts) der vorausgefüllte Startwert nicht mehr stimmt, weil
 * zwischen den Sprints außerhalb weitergelesen wurde: ohne diese Korrektur
 * würde die Differenz fälschlich als "in diesem Sprint gelesen" gezählt,
 * obwohl sie vor Sprintbeginn entstanden ist.
 */
export async function fixBookStart(
  participant: ISprintParticipant,
  newValue: number
): Promise<void> {
  const book = getCurrentBook(participant);
  if (!book) return;

  switch (book.format) {
    case "physical":
      book.startPage = newValue;
      book.currentPage = newValue;
      break;
    case "ebook":
      book.startPercent = newValue;
      book.currentPercent = newValue;
      break;
    case "audiobook":
      if (book.audiobookPercentMode) {
        book.startPercent = newValue;
        book.currentPercent = newValue;
      } else {
        book.startMinutes = newValue;
        book.currentMinutes = newValue;
      }
      break;
  }

  // Bibliotheks-Eintrag ebenfalls auf den korrigierten Stand aktualisieren.
  const totalValue = book.format === "audiobook" ? book.totalMinutes! : book.totalPages!;
  await findOrCreateBook(
    participant.userId,
    participant.guildId,
    book.title,
    book.format,
    totalValue,
    book.audiobookPercentMode,
    newValue
  );

  await participant.save();
}

/**
 * Ändert den Status eines Teilnehmers und pflegt dabei das Pause-Tracking:
 * - Pause: merkt sich den Zeitpunkt (pausedAt)
 * - Weiter: rechnet die abgelaufene Pausenzeit in totalPausedMs ein
 * - Verlassen: falls gerade pausiert, wird auch diese letzte Pause noch
 *   eingerechnet, bevor leftAt gesetzt wird (sonst würde die Pausenzeit
 *   zwischen letztem Pausieren und Verlassen fälschlich als Lesezeit zählen)
 */
export async function setParticipantStatus(
  participantId: string,
  status: "active" | "paused" | "left"
): Promise<void> {
  const participant = await SprintParticipant.findById(participantId);
  if (!participant) return;

  const now = new Date();

  if (status === "paused" && !participant.pausedAt) {
    participant.pausedAt = now;
  }

  if ((status === "active" || status === "left") && participant.pausedAt) {
    participant.totalPausedMs += now.getTime() - participant.pausedAt.getTime();
    participant.pausedAt = undefined;
  }

  if (status === "left") {
    participant.leftAt = now;
  }

  participant.status = status;
  await participant.save();
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
 * Seiten (als Seiten-Äquivalent über alle Formate hinweg), vergibt XP,
 * aktualisiert Streak & Nutzerstatistiken und liefert eine sortierte
 * Ergebnisliste fürs öffentliche Abschluss-Leaderboard zurück.
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

  // Auch Teilnehmer, die vorzeitig verlassen haben (status "left"), zählen
  // im Leaderboard - mit dem Stand, den sie bis zu ihrem Ausstieg erreicht
  // hatten (books wurde beim Verlassen nicht mehr verändert).
  const participants = await SprintParticipant.find({ sprintId });

  const results: ParticipantResult[] = [];

  for (const participant of participants) {
    // Seiten-Äquivalent über ALLE Bücher/Formate hinweg summiert - das ist
    // die "Im Hintergrund alles in Seiten"-Berechnung aus der Anforderung.
    const rawPagesRead = participant.books.reduce((sum, book) => sum + getPagesEquivalent(book), 0);
    // Absicherung gegen fehlerhafte/alte Datensätze - ein einzelner kaputter
    // Teilnehmer soll nicht die gesamte Auswertung crashen lassen.
    const totalPagesRead = Number.isFinite(rawPagesRead) ? Math.round(rawPagesRead) : 0;

    const goalReached = participant.books.some((book) => isBookGoalReached(book));
    const finishedBooksCount = participant.books.filter((book) => book.isFinished).length;

    // Lesezeit = Zeit von Beitritt bis Sprintende bzw. bis zum vorzeitigen
    // Verlassen (leftAt), MINUS aller Pausenzeiten, gedeckelt auf die geplante
    // Sprintdauer. Ohne Deckel würde die Wartezeit während der Kulanzzeit
    // (bis zu GRACE_PERIOD_MINUTES) fälschlich als zusätzliche "Lesezeit"
    // mitgezählt werden.
    const participantEndTime = participant.leftAt ?? sprint.endTime ?? new Date();

    // Falls noch eine Pause "läuft" (z.B. wer pausiert hat und den Sprint nie
    // wieder aktiv fortgesetzt hat), zählt die Zeit bis zum Sprintende auch
    // noch als Pause - sonst würde sie fälschlich als Lesezeit durchgehen.
    const stillRunningPauseMs = participant.pausedAt
      ? Math.max(0, participantEndTime.getTime() - participant.pausedAt.getTime())
      : 0;
    const totalPausedMs = participant.totalPausedMs + stillRunningPauseMs;

    const rawMinutesRead = Math.round(
      (participantEndTime.getTime() - participant.joinedAt.getTime() - totalPausedMs) / 60_000
    );
    const cappedMinutesRead = Math.min(rawMinutesRead, sprint.duration);
    const minutesRead = Number.isFinite(cappedMinutesRead) ? Math.max(0, cappedMinutesRead) : 0;

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

    // Fortschritt im NEUEN Level (nach der XP-Vergabe) für die Anzeige im
    // Abschluss-Embed ("noch X XP bis zum nächsten Level").
    const levelProgressAfterGain = calculateLevelProgress(user.xp);

    user.totalPagesRead += totalPagesRead;
    user.totalMinutesRead += minutesRead;
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
      leftEarly: participant.status === "left",
      minutesInSprint: minutesRead,
      currentLevelXP: levelProgressAfterGain.currentLevelXP,
      xpForNextLevel: levelProgressAfterGain.xpForNextLevel,
    });
  }

  // Platzierung nach gelesenen Gesamtseiten (Seiten-Äquivalent), absteigend.
  results.sort((a, b) => b.totalPagesRead - a.totalPagesRead);
  results.forEach((result, index) => (result.placement = index + 1));

  return results;
}
