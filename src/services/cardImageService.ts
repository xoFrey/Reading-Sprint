import { createCanvas, loadImage, Image } from "@napi-rs/canvas";
import { registerCanvasFonts } from "../utils/registerFonts";

registerCanvasFonts();

// Zentrale Font-Familie mit Fallback-Kette: Skia (die Rendering-Engine hinter
// @napi-rs/canvas) probiert die Familien in Reihenfolge durch, bis eine
// passende Glyphe gefunden wird - "Noto Color Emoji" deckt Emojis ab,
// "Noto Sans" normalen Text, die generischen Namen sind der letzte Fallback.
const FONT_FAMILY = '"Noto Sans", "Noto Color Emoji", "DejaVu Sans", "Liberation Sans", sans-serif';

/**
 * Bereitet Text fürs Canvas-Rendering auf. Discord-Namen können beliebige
 * Unicode-Zeichen enthalten (z.B. "𝒙𝒆𝒏𝒊𝒂" = mathematische Stil-Buchstaben,
 * kein echtes "x"/"e"/"n"...) - dafür gibt es keine realistische
 * Font-Lösung, da praktisch jedes Unicode-Schriftsystem der Welt abgedeckt
 * werden müsste. Stattdessen:
 * 1. NFKD-Normalisierung löst Kompatibilitätszeichen (Stil-Buchstaben,
 *    Ligaturen, Vollbreite-Formen etc.) automatisch in normale Buchstaben auf.
 * 2. Freistehende Kombinationszeichen (Akzente ohne Basisbuchstabe) werden entfernt.
 * 3. Alles außerhalb eines sinnvollen "darstellbaren" Bereichs (Standard-
 *    Buchstaben/Zahlen/Satzzeichen + gängige Emoji-Blöcke) wird entfernt,
 *    statt als kaputtes Kästchen ("Tofu") angezeigt zu werden.
 */
function sanitizeForCanvas(text: string): string {
  let result = text.normalize("NFKD");
  result = result.replace(/[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]/g, "");
  result = result.replace(
    /[^\x20-\x7E\u00A0-\u024F\u1E00-\u1EFF\u2010-\u2027\u2030-\u205E\u2600-\u27BF\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u200D\uFE0F]/gu,
    ""
  );
  return result.trim();
}

// Ein Eintrag in der Karten-Liste (ein Nutzer/eine Platzierung).
export interface CardEntry {
  rank: number;
  avatarUrl?: string;
  boldLine: string; // z.B. "#1 - Frey"
  detailLines: string[]; // beliebig viele Zeilen darunter, z.B. Buch, XP, Status
}

export interface CardImageOptions {
  title: string;
  subtitle?: string;
}

// 2-Spalten-Raster: pro "Zeile" im Bild stehen 2 Einträge nebeneinander.
// Das Bild ist deutlich breiter als vorher, damit auch lange Buchtitel
// nicht sofort abgeschnitten werden müssen.
const COLUMNS = 2;
const WIDTH = 1040;
const COLUMN_GAP = 40;
const PADDING_X = 48;
const COLUMN_WIDTH = (WIDTH - PADDING_X * 2 - COLUMN_GAP) / COLUMNS;

const HEADER_HEIGHT_WITH_SUBTITLE = 175;
const HEADER_HEIGHT_NO_SUBTITLE = 130;
const LINE_HEIGHT = 24;
const ROW_GAP = 26;
const CIRCLE_RADIUS = 34;

const COLORS = {
  background: "#FCE8E6",
  title: "#C4847E",
  subtitle: "#CDA19C",
  circleFill: "#D9B9B4",
  circleText: "#8A4B45",
  entryTitle: "#8A4B45",
  entryDetail: "#A97C74",
  rankBadgeFill: "#8A4B45",
  rankBadgeText: "#FCE8E6",
};

function truncateToWidth(ctx: any, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

async function tryLoadImage(url: string | undefined): Promise<Image | null> {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return await loadImage(Buffer.from(arrayBuffer));
  } catch {
    return null;
  }
}

function drawAvatarCircle(ctx: any, x: number, y: number, rank: number, avatarImage: Image | null): void {
  if (avatarImage) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImage, x - CIRCLE_RADIUS, y - CIRCLE_RADIUS, CIRCLE_RADIUS * 2, CIRCLE_RADIUS * 2);
    ctx.restore();

    const badgeRadius = 14;
    const badgeX = x + CIRCLE_RADIUS - 6;
    const badgeY = y + CIRCLE_RADIUS - 6;

    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.rankBadgeFill;
    ctx.fill();

    ctx.fillStyle = COLORS.rankBadgeText;
    ctx.font = `bold 14px ${FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.fillText(String(rank), badgeX, badgeY + 5);
    return;
  }

  ctx.beginPath();
  ctx.arc(x, y, CIRCLE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.circleFill;
  ctx.fill();

  ctx.fillStyle = COLORS.circleText;
  ctx.font = `bold 26px ${FONT_FAMILY}`;
  ctx.textAlign = "center";
  ctx.fillText(String(rank), x, y + 9);
}

// Höhe, die ein einzelner Eintrag für seinen Text braucht (Kopfzeile + Detail-Zeilen).
function estimateEntryHeight(entry: CardEntry): number {
  const textHeight = (entry.detailLines.length + 1) * LINE_HEIGHT + 10;
  return Math.max(textHeight, CIRCLE_RADIUS * 2 + 10);
}

function drawEntry(ctx: any, entry: CardEntry, columnX: number, y: number, avatarImage: Image | null): void {
  const circleX = columnX + CIRCLE_RADIUS;
  const circleY = y + CIRCLE_RADIUS + 2;

  drawAvatarCircle(ctx, circleX, circleY, entry.rank, avatarImage);

  const textX = columnX + CIRCLE_RADIUS * 2 + 24;
  const maxTextWidth = COLUMN_WIDTH - CIRCLE_RADIUS * 2 - 24;

  ctx.textAlign = "left";

  ctx.fillStyle = COLORS.entryTitle;
  ctx.font = `bold 22px ${FONT_FAMILY}`;
  ctx.fillText(truncateToWidth(ctx, sanitizeForCanvas(entry.boldLine), maxTextWidth), textX, y + 18);

  ctx.fillStyle = COLORS.entryDetail;
  ctx.font = `18px ${FONT_FAMILY}`;
  entry.detailLines.forEach((line, lineIndex) => {
    ctx.fillText(
      truncateToWidth(ctx, sanitizeForCanvas(line), maxTextWidth),
      textX,
      y + 18 + LINE_HEIGHT * (lineIndex + 1)
    );
  });
}

/**
 * Baut eine Liste im "Leaderboard-Stil" als 2-Spalten-Raster: Titel,
 * optionaler Untertitel, darunter Einträge zu je 2 nebeneinander (Avatar-
 * Kreis mit Rang-Badge, fette Kopfzeile, beliebig viele Detail-Zeilen).
 * Wird sowohl vom Leaderboard als auch vom Sprint-Abschluss verwendet,
 * damit beide optisch identisch aussehen.
 */
export async function buildCardListImage(
  options: CardImageOptions,
  entries: CardEntry[]
): Promise<Buffer> {
  const headerHeight = options.subtitle ? HEADER_HEIGHT_WITH_SUBTITLE : HEADER_HEIGHT_NO_SUBTITLE;

  // Einträge in Zeilen zu je COLUMNS (2) gruppieren; die Zeilenhöhe richtet
  // sich nach dem "höheren" der beiden Einträge in dieser Zeile, damit beide
  // Spalten sauber ausgerichtet bleiben.
  const rows: CardEntry[][] = [];
  for (let i = 0; i < entries.length; i += COLUMNS) {
    rows.push(entries.slice(i, i + COLUMNS));
  }
  const rowHeights = rows.map((row) => Math.max(...row.map(estimateEntryHeight)));
  const bodyHeight = rowHeights.reduce((sum, h) => sum + h + ROW_GAP, 0);
  const height = headerHeight + bodyHeight + 20;

  const canvas = createCanvas(WIDTH, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.title;
  ctx.font = `bold 46px ${FONT_FAMILY}`;
  ctx.fillText(sanitizeForCanvas(options.title), WIDTH / 2, 68);

  if (options.subtitle) {
    ctx.fillStyle = COLORS.subtitle;
    ctx.font = `bold 22px ${FONT_FAMILY}`;
    ctx.fillText(sanitizeForCanvas(options.subtitle), WIDTH / 2, 104);
  }

  const avatarImages = await Promise.all(entries.map((entry) => tryLoadImage(entry.avatarUrl)));

  let y = headerHeight;

  rows.forEach((row, rowIndex) => {
    const rowHeight = rowHeights[rowIndex];

    row.forEach((entry, columnIndex) => {
      const columnX = PADDING_X + columnIndex * (COLUMN_WIDTH + COLUMN_GAP);
      const entryIndex = rowIndex * COLUMNS + columnIndex;
      drawEntry(ctx, entry, columnX, y, avatarImages[entryIndex]);
    });

    y += rowHeight + ROW_GAP;
  });

  return canvas.toBuffer("image/png");
}
