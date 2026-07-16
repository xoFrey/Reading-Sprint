// Formatiert Minuten als lesbare Zeitangabe (z.B. "45 Min", "1 Std", "2 Std 15 Min").
// Zentral hier, damit Embeds und das Leaderboard-Bild dieselbe Darstellung nutzen.
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining === 0 ? `${hours} Std` : `${hours} Std ${remaining} Min`;
}
