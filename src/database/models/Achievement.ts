import { Schema, model, Document } from "mongoose";

// Definiert ein Achievement. Enthält NUR die Definition, nicht wer es
// bereits freigeschaltet hat (das liegt in User.achievements als Referenz).
// So kann man neue Achievements per DB-Eintrag hinzufügen, ohne Code zu deployen.
export interface IAchievement extends Document {
  key: string; // eindeutiger, sprechender Code, z.B. "first_book_finished"
  name: string;
  description: string;
  icon: string; // Emoji oder Icon-URL

  xpReward: number;
  roleReward?: string; // optionale Discord-Role-ID

  // Freitext-Bedingung, die vom AchievementService ausgewertet wird,
  // z.B. "totalPagesRead >= 100". Wird in Schritt "Achievements" konkretisiert.
  condition: string;

  createdAt: Date;
}

const AchievementSchema = new Schema<IAchievement>({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: "🏅" },

  xpReward: { type: Number, default: 0 },
  roleReward: { type: String },

  condition: { type: String, required: true },

  createdAt: { type: Date, default: Date.now },
});

export const Achievement = model<IAchievement>("Achievement", AchievementSchema);
