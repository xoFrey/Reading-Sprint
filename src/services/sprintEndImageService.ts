import { Client, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { ParticipantResult } from "./sprintService";
import { buildCardListImage, CardEntry } from "./cardImageService";
import { formatMinutes } from "../utils/format";
import { Texts } from "../config/texts";
import { CustomId, buildCustomId } from "../config/constants";

export const RESULTS_PAGE_SIZE = 10;

export function getTotalResultPages(resultCount: number): number {
  return Math.max(1, Math.ceil(resultCount / RESULTS_PAGE_SIZE));
}

/**
 * Baut EINE Seite des Sprint-Abschluss-Bilds über dieselbe Karten-Engine wie
 * das Leaderboard (siehe cardImageService.ts) - bewusst derselbe visuelle
 * Stil, inklusive Avatar-Bildern statt reiner Rangzahlen.
 *
 * Nimmt den Client statt einer Interaction entgegen, da dieser sowohl vom
 * manuellen Admin-Abbruch (endButton.ts), dem automatischen Scheduler
 * (jobs/scheduler.ts) als auch beim Blättern (sprintResultsPageButton.ts)
 * aufgerufen wird.
 *
 * @param results ALLE Ergebnisse (wird intern anhand von `page` geschnitten)
 * @param page 1-basierter Seitenindex
 */
export async function buildSprintEndImage(
  client: Client,
  guildId: string,
  results: ParticipantResult[],
  sprintDurationMinutes: number,
  page = 1
): Promise<Buffer> {
  const totalPages = getTotalResultPages(results.length);
  const pageResults = results.slice((page - 1) * RESULTS_PAGE_SIZE, page * RESULTS_PAGE_SIZE);

  const guild = await client.guilds.fetch(guildId).catch(() => null);

  const entries: CardEntry[] = [];

  for (const result of pageResults) {
    const member = await guild?.members.fetch(result.userId).catch(() => null);
    const discordUser =
      member?.user ??
      (await client.users.fetch(result.userId).catch(() => null));

    const displayName =
      member?.displayName ?? discordUser?.username ?? "Unbekannt";
    const avatarUrl = discordUser?.displayAvatarURL({
      extension: "png",
      size: 128,
    });

    const bookLines = result.books.map((book) => {
      const pagesRead = book.currentPage - book.startPage;
      // Falls ein Ziel gesetzt war, zeigt die Zeile "gelesen/Ziel Seiten"
      // (z.B. "50/30 Seiten" = 30 Seiten waren das Ziel, 50 wurden gelesen).
      if (book.goalPage !== undefined) {
        const goalPagesWanted = book.goalPage - book.startPage;
        return `${book.title}: ${pagesRead}/${goalPagesWanted} Seiten`;
      }
      return `${book.title}: ${pagesRead} Seiten`;
    });

    const xpUntilNext = result.xpForNextLevel - result.currentLevelXP;
    const goalStatus = result.goalReached
      ? Texts.sprintEnd.goalReached
      : Texts.sprintEnd.goalMissed;

    const detailLines: string[] = [...bookLines];

    // Gesamt-Seitenzahl nur als eigene Zeile, wenn mehrere Bücher gelesen
    // wurden - bei nur einem Buch wäre das eine reine Wiederholung der Zeile oben.
    if (result.books.length > 1) {
      detailLines.push(`Gesamt: ${result.totalPagesRead} Seiten`);
    }

    detailLines.push(
      `${formatMinutes(result.minutesInSprint)}`,
      `+${result.xpEarned} XP`,
      `${xpUntilNext} XP bis Level ${result.newLevel + 1}`,
      goalStatus
    );
    if (result.leveledUp)
      detailLines.push(Texts.sprintEnd.levelUp(result.newLevel));
    if (result.leftEarly) detailLines.push(Texts.sprintEnd.leftEarly);

    entries.push({
      rank: result.placement,
      avatarUrl,
      boldLine: `#${result.placement} - ${displayName}`,
      detailLines,
    });
  }

  const subtitle =
    totalPages > 1
      ? `Geplante Dauer: ${formatMinutes(sprintDurationMinutes)} · Seite ${page}/${totalPages}`
      : `Geplante Dauer: ${formatMinutes(sprintDurationMinutes)}`;

  return buildCardListImage({ title: "Sprint beendet!", subtitle }, entries);
}

/**
 * Baut die Zurück/Weiter-Buttons fürs Blättern durch die Ergebnisse.
 * Gibt null zurück, wenn nur eine Seite existiert (keine Buttons nötig).
 */
export function buildResultsPaginationRow(
  sprintId: string,
  page: number,
  totalPages: number
): ActionRowBuilder<ButtonBuilder> | null {
  if (totalPages <= 1) return null;

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(buildCustomId(CustomId.SPRINT_RESULTS_PAGE, sprintId, String(page - 1)))
      .setLabel("◀ Zurück")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(buildCustomId(CustomId.SPRINT_RESULTS_PAGE, sprintId, String(page + 1)))
      .setLabel("Weiter ▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
  );
}
