import { createCanvas, loadImage, Image } from "@napi-rs/canvas";

export interface LeaderboardImageEntry {
  rank: number;
  displayName: string;
  bookTitle: string;
  pagesRead: number;
  minutesRead: number;
  // --- Beispiel für "weitere Infos hinzufügen": einfach neue Felder hier
  // ergänzen und weiter unten in buildLeaderboardImage() eine weitere
  // ctx.fillText(...)-Zeile schreiben. So einfach ist das Muster.
  level: number;
  currentStreak: number;
  avatarUrl?: string; // Discord-Avatar-URL; optional, falls keiner geladen werden kann
}

const WIDTH = 576;
const HEADER_HEIGHT = 175;
const ENTRY_HEIGHT = 150; // etwas höher als vorher, wegen der zusätzlichen Zeile
const FOOTER_HEIGHT = 30;
const PADDING_X = 48;
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

export function formatReadingTime(minutes: number): string {
  if (minutes < 60) return `${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining === 0 ? `${hours} Std` : `${hours} Std ${remaining} Min`;
}

function truncateToWidth(ctx: any, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

/**
 * Lädt ein Bild von einer URL (z.B. Discord-Avatar) als Buffer und dann als
 * Canvas-Image. Gibt null zurück, falls das Laden fehlschlägt (z.B. kein
 * Avatar gesetzt, Netzwerkfehler) - der Aufrufer zeichnet dann einen
 * Fallback-Kreis mit der Rangzahl statt eines Bildes.
 *
 * BEISPIEL FÜRS ERWEITERN: Genau nach diesem Muster (fetch -> Buffer ->
 * loadImage) kannst du auch ein Buchcover, ein Server-Icon o.ä. laden.
 */
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

/**
 * Zeichnet einen Kreis mit Avatar-Bild (falls vorhanden) und einer kleinen
 * Rang-Nummer als Badge unten rechts. Fällt auf einen reinen Farbkreis mit
 * zentrierter Nummer zurück, wenn kein Bild geladen werden konnte.
 */
function drawAvatarCircle(ctx: any, x: number, y: number, rank: number, avatarImage: Image | null): void {
  if (avatarImage) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip(); // alles außerhalb des Kreises wird ausgeblendet
    ctx.drawImage(avatarImage, x - CIRCLE_RADIUS, y - CIRCLE_RADIUS, CIRCLE_RADIUS * 2, CIRCLE_RADIUS * 2);
    ctx.restore();

    // Kleines Rang-Badge unten rechts auf dem Avatar
    const badgeRadius = 14;
    const badgeX = x + CIRCLE_RADIUS - 6;
    const badgeY = y + CIRCLE_RADIUS - 6;

    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.rankBadgeFill;
    ctx.fill();

    ctx.fillStyle = COLORS.rankBadgeText;
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(rank), badgeX, badgeY + 5);
    return;
  }

  // Fallback: einfacher Farbkreis mit zentrierter Rangzahl (wie bisher).
  ctx.beginPath();
  ctx.arc(x, y, CIRCLE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.circleFill;
  ctx.fill();

  ctx.fillStyle = COLORS.circleText;
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(rank), x, y + 9);
}

export async function buildLeaderboardImage(entries: LeaderboardImageEntry[]): Promise<Buffer> {
  const height = HEADER_HEIGHT + entries.length * ENTRY_HEIGHT + FOOTER_HEIGHT;
  const canvas = createCanvas(WIDTH, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.title;
  ctx.font = "bold 50px sans-serif";
  ctx.fillText("Leaderboard", WIDTH / 2, 72);

  ctx.fillStyle = COLORS.subtitle;
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("Gesamtzeit", WIDTH / 2, 108);

  // Alle Avatare VOR dem Zeichnen laden (parallel), damit der Canvas-Code
  // unten synchron bleibt und übersichtlich.
  const avatarImages = await Promise.all(entries.map((entry) => tryLoadImage(entry.avatarUrl)));

  let y = HEADER_HEIGHT;
  const textX = PADDING_X + CIRCLE_RADIUS * 2 + 24;
  const maxTextWidth = WIDTH - textX - PADDING_X;

  entries.forEach((entry, index) => {
    const circleX = PADDING_X + CIRCLE_RADIUS;
    const circleY = y + ENTRY_HEIGHT / 2 - 20;

    drawAvatarCircle(ctx, circleX, circleY, entry.rank, avatarImages[index]);

    ctx.textAlign = "left";

    ctx.fillStyle = COLORS.entryTitle;
    ctx.font = "bold 23px sans-serif";
    const nameLine = truncateToWidth(ctx, `#${entry.rank} - ${entry.displayName}`, maxTextWidth);
    ctx.fillText(nameLine, textX, y + 18);

    ctx.fillStyle = COLORS.entryDetail;
    ctx.font = "19px sans-serif";
    const bookLine = truncateToWidth(ctx, entry.bookTitle, maxTextWidth);
    ctx.fillText(bookLine, textX, y + 46);
    ctx.fillText(`${entry.pagesRead} Seiten · ${formatReadingTime(entry.minutesRead)}`, textX, y + 72);

    // --- Die neue, zusätzliche Zeile: Level & Streak. Genau so fügst du
    // weitere Infos hinzu - eine Zeile Text mit passendem y-Offset.
    ctx.fillText(`Level ${entry.level} · 🔥 ${entry.currentStreak} Tage Streak`, textX, y + 98);

    y += ENTRY_HEIGHT;
  });

  return canvas.toBuffer("image/png");
}
