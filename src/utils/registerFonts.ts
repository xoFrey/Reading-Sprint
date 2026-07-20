import { GlobalFonts } from "@napi-rs/canvas";
import { existsSync } from "fs";

/**
 * @napi-rs/canvas findet Systemschriften nicht immer zuverlässig automatisch
 * über fontconfig (abhängig von Version/Plattform) - selbst wenn die
 * .deb-Pakete installiert sind, kann es sein, dass sie beim Rendern nicht
 * gezogen werden. Deshalb hier explizit registrieren, mit klaren
 * Familiennamen, die dann in cardImageService.ts referenziert werden.
 *
 * Jeder Registrierungsversuch prüft erst, ob die Datei existiert, und wird
 * einzeln try/catch-abgesichert, damit ein fehlender Font (z.B. auf Windows
 * beim lokalen Testen) den Bot nicht zum Absturz bringt.
 */
const FONT_CANDIDATES: Array<{ path: string; family: string }> = [
  // Debian/Ubuntu Standardpfade (passend zu: apt install fonts-noto fonts-noto-color-emoji)
  { path: "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf", family: "Noto Sans" },
  { path: "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf", family: "Noto Sans" },
  { path: "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", family: "Noto Color Emoji" },
  // Fallbacks, falls Noto fehlt aber DejaVu/Liberation vorhanden sind
  { path: "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", family: "DejaVu Sans" },
  { path: "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", family: "DejaVu Sans" },
  { path: "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", family: "Liberation Sans" },
  { path: "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", family: "Liberation Sans" },
];

let registered = false;

export function registerCanvasFonts(): void {
  if (registered) return; // nur einmal pro Prozess nötig
  registered = true;

  for (const { path, family } of FONT_CANDIDATES) {
    if (!existsSync(path)) continue;

    try {
      GlobalFonts.registerFromPath(path, family);
      console.log(`[Fonts] "${family}" registriert (${path})`);
    } catch (error) {
      console.error(`[Fonts] Konnte ${path} nicht registrieren:`, error);
    }
  }

  if (GlobalFonts.families.length === 0) {
    console.error(
      "[Fonts] Keine Schriftarten gefunden! Text in generierten Bildern wird vermutlich leer bleiben. " +
        "Installiere z.B.: sudo apt install fonts-noto fonts-noto-color-emoji"
    );
  }
}
