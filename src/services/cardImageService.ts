import { createCanvas, loadImage, Image } from "@napi-rs/canvas";

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

const WIDTH = 576;
const HEADER_HEIGHT_WITH_SUBTITLE = 175;
const HEADER_HEIGHT_NO_SUBTITLE = 130;
const LINE_HEIGHT = 24;
const ENTRY_GAP = 22;
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
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(rank), badgeX, badgeY + 5);
    return;
  }

  ctx.beginPath();
  ctx.arc(x, y, CIRCLE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.circleFill;
  ctx.fill();

  ctx.fillStyle = COLORS.circleText;
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(rank), x, y + 9);
}

// Höhe eines Eintrags richtet sich nach der Anzahl seiner Detail-Zeilen
// (z.B. mehr Zeilen bei mehreren Büchern in einem Sprint).
function estimateEntryHeight(entry: CardEntry): number {
  const textHeight = (entry.detailLines.length + 1) * LINE_HEIGHT + 10;
  return Math.max(textHeight, CIRCLE_RADIUS * 2 + 10);
}

/**
 * Baut eine Liste im "Leaderboard-Stil": Titel, optionaler Untertitel,
 * darunter pro Eintrag ein Avatar-Kreis mit Rang-Badge, eine fette Kopfzeile
 * und beliebig viele Detail-Zeilen. Wird sowohl vom Leaderboard als auch vom
 * Sprint-Abschluss verwendet, damit beide optisch identisch aussehen.
 */
export async function buildCardListImage(
  options: CardImageOptions,
  entries: CardEntry[]
): Promise<Buffer> {
  const headerHeight = options.subtitle ? HEADER_HEIGHT_WITH_SUBTITLE : HEADER_HEIGHT_NO_SUBTITLE;
  const entryHeights = entries.map(estimateEntryHeight);
  const bodyHeight = entryHeights.reduce((sum, h) => sum + h + ENTRY_GAP, 0);
  const height = headerHeight + bodyHeight + 20;

  const canvas = createCanvas(WIDTH, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.title;
  ctx.font = "bold 46px sans-serif";
  ctx.fillText(options.title, WIDTH / 2, 68);

  if (options.subtitle) {
    ctx.fillStyle = COLORS.subtitle;
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(options.subtitle, WIDTH / 2, 104);
  }

  const avatarImages = await Promise.all(entries.map((entry) => tryLoadImage(entry.avatarUrl)));

  let y = headerHeight;
  const textX = PADDING_X + CIRCLE_RADIUS * 2 + 24;
  const maxTextWidth = WIDTH - textX - PADDING_X;

  entries.forEach((entry, index) => {
    const entryHeight = entryHeights[index];
    const circleX = PADDING_X + CIRCLE_RADIUS;
    const circleY = y + CIRCLE_RADIUS + 2;

    drawAvatarCircle(ctx, circleX, circleY, entry.rank, avatarImages[index]);

    ctx.textAlign = "left";

    ctx.fillStyle = COLORS.entryTitle;
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(truncateToWidth(ctx, entry.boldLine, maxTextWidth), textX, y + 18);

    ctx.fillStyle = COLORS.entryDetail;
    ctx.font = "18px sans-serif";
    entry.detailLines.forEach((line, lineIndex) => {
      ctx.fillText(truncateToWidth(ctx, line, maxTextWidth), textX, y + 18 + LINE_HEIGHT * (lineIndex + 1));
    });

    y += entryHeight + ENTRY_GAP;
  });

  return canvas.toBuffer("image/png");
}
