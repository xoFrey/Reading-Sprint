/**
 * Level-Kurve: Jedes Level benötigt etwas mehr XP als das vorherige.
 * Formel: benötigte XP für Level N -> N+1 = round(BASE * N^EXPONENT)
 *
 * Mit BASE=100 und EXPONENT=1.5 ergibt sich z.B.:
 *   Level 1 -> 2:  100 XP
 *   Level 2 -> 3:  ~283 XP
 *   Level 3 -> 4:  ~520 XP
 *   Level 5 -> 6:  ~1118 XP
 *
 * Das sorgt für ein spürbares, aber nicht explodierendes Wachstum
 * (klassische "leicht überproportionale" RPG-Kurve).
 * Beide Werte sind hier zentral anpassbar, falls das Tempo geändert werden soll.
 */
const BASE = 100;
const EXPONENT = 1.5;

// XP, die man benötigt, um von `level` auf `level + 1` aufzusteigen.
export function xpRequiredForNextLevel(level: number): number {
  return Math.round(BASE * Math.pow(level, EXPONENT));
}

export interface LevelProgress {
  level: number;
  currentLevelXP: number; // XP innerhalb des aktuellen Levels
  xpForNextLevel: number; // benötigte XP, um das nächste Level zu erreichen
  totalXP: number; // gesamte, jemals gesammelte XP
}

/**
 * Berechnet aus der Gesamt-XP eines Nutzers dessen aktuelles Level
 * und den Fortschritt innerhalb dieses Levels.
 *
 * Wird sowohl beim Leaderboard-Anzeigen als auch nach jeder XP-Vergabe
 * (XPService.addXP) aufgerufen, um zu prüfen, ob ein Level-Up stattfand.
 */
export function calculateLevelProgress(totalXP: number): LevelProgress {
  let level = 1;
  let remainingXP = totalXP;

  while (remainingXP >= xpRequiredForNextLevel(level)) {
    remainingXP -= xpRequiredForNextLevel(level);
    level++;
  }

  return {
    level,
    currentLevelXP: remainingXP,
    xpForNextLevel: xpRequiredForNextLevel(level),
    totalXP,
  };
}
