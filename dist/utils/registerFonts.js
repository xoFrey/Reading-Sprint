"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCanvasFonts = registerCanvasFonts;
const canvas_1 = require("@napi-rs/canvas");
const fs_1 = require("fs");
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
const FONT_CANDIDATES = [
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
function registerCanvasFonts() {
    if (registered)
        return; // nur einmal pro Prozess nötig
    registered = true;
    for (const { path, family } of FONT_CANDIDATES) {
        if (!(0, fs_1.existsSync)(path))
            continue;
        try {
            canvas_1.GlobalFonts.registerFromPath(path, family);
            console.log(`[Fonts] "${family}" registriert (${path})`);
        }
        catch (error) {
            console.error(`[Fonts] Konnte ${path} nicht registrieren:`, error);
        }
    }
    if (canvas_1.GlobalFonts.families.length === 0) {
        console.error("[Fonts] Keine Schriftarten gefunden! Text in generierten Bildern wird vermutlich leer bleiben. " +
            "Installiere z.B.: sudo apt install fonts-noto fonts-noto-color-emoji");
    }
}
