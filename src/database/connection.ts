import mongoose from "mongoose";

/**
 * Baut die Verbindung zur MongoDB-Datenbank auf.
 * Wird einmalig beim Bot-Start (index.ts) aufgerufen.
 */
export async function connectDatabase(uri: string): Promise<void> {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri);
    console.log("[Database] Verbindung zu MongoDB erfolgreich hergestellt.");
  } catch (error) {
    console.error("[Database] Verbindung fehlgeschlagen:", error);
    process.exit(1);
  }
}
