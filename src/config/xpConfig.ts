import { XPConfig } from "../types";

// Globale Standard-Werte für das XP-System.
// Einzelne Server können diese via Guild.xpConfig überschreiben (siehe Guild-Modell).
export const DEFAULT_XP_CONFIG: XPConfig = {
  pagesPerXP: 1, // 1 XP pro gelesener Seite
  goalBonus: 20, // Bonus-XP, wenn das gesetzte Seitenziel erreicht wurde
  streakBonus: 5, // Bonus-XP pro Streak-Tag (z.B. Streak 3 -> +15 XP)
  finishBonus: 50, // Bonus-XP, wenn ein Buch komplett fertiggelesen wurde
};

// Mindestanzahl gelesener Seiten, damit eine Sprint-Teilnahme für den Streak zählt.
// Wird sowohl bei der XP-Berechnung (Streak-Bonus) als auch später im
// Sprint-System (Aktualisierung von User.currentStreak) verwendet.
export const MIN_PAGES_FOR_STREAK = 5;

/**
 * Verschmilzt die globalen Defaults mit optionalen Server-Overrides.
 * So muss ein Server nur die Werte angeben, die er wirklich ändern will.
 *
 * WICHTIG: Mongoose legt beim Erstellen eines Guild-Dokuments automatisch ein
 * leeres xpConfig-Unterdokument an, dessen Zahlenfelder explizit auf
 * "undefined" stehen (nicht einfach "nicht vorhanden"). Ein normales
 * Object-Spread ({...DEFAULT_XP_CONFIG, ...override}) würde diese
 * undefined-Werte fälschlich über die echten Defaults legen und z.B.
 * pagesPerXP auf undefined setzen -> NaN bei jeder XP-Berechnung. Deshalb
 * hier gezielt nur definierte Werte übernehmen.
 */
export function resolveXPConfig(override?: Partial<XPConfig>): XPConfig {
  const config: XPConfig = { ...DEFAULT_XP_CONFIG };

  if (override) {
    for (const key of Object.keys(DEFAULT_XP_CONFIG) as (keyof XPConfig)[]) {
      const value = override[key];
      if (value !== undefined && value !== null && Number.isFinite(value)) {
        config[key] = value;
      }
    }
  }

  return config;
}
