// Parst ein Datum im Format TT.MM.JJJJ und eine Uhrzeit im Format HH:MM
// zu einem einzelnen Date-Objekt. Gibt null zurück, wenn das Format ungültig ist.
export function parseGermanDateTime(dateStr: string, timeStr: string): Date | null {
  const dateMatch = dateStr.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  const timeMatch = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);

  if (!dateMatch || !timeMatch) return null;

  const [, day, month, year] = dateMatch;
  const [, hour, minute] = timeMatch;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

// Parst eine Uhrzeit (HH:MM) relativ zu JETZT: liegt die Zeit heute noch in
// der Zukunft, wird der heutige Tag verwendet - liegt sie schon in der
// Vergangenheit (z.B. Start um 23:50, Ende "00:30"), wird automatisch der
// nächste Tag angenommen (unterstützt Sprints über Mitternacht).
export function parseTimeRelativeToNow(timeStr: string): Date | null {
  const timeMatch = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) return null;

  const [, hour, minute] = timeMatch;
  const now = new Date();

  const result = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    Number(hour),
    Number(minute)
  );

  if (Number.isNaN(result.getTime())) return null;

  if (result.getTime() <= now.getTime()) {
    result.setDate(result.getDate() + 1);
  }

  return result;
}
export function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

// Parst eine nicht-negative Ganzzahl (>=0) aus einem Modal-Textfeld - für
// Seitenangaben (aktuelle Seite, Ziel-Seite), da man z.B. bei Seite 0
// (vor dem ersten gelesenen Kapitel) starten können muss.
export function parseNonNegativeInt(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
