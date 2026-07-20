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

// Parst eine positive Ganzzahl (>0) aus einem Modal-Textfeld, z.B. für
// Gesamtseitenzahl oder Dauer - dort ergibt 0 keinen Sinn.
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
