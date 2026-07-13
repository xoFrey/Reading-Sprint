import { Schema, model, Document, Types } from "mongoose";

// Repräsentiert einen Nutzer innerhalb eines bestimmten Servers (guildId).
// Ein Discord-User kann auf mehreren Servern unterschiedliche Fortschritte haben,
// daher ist die Kombination discordId + guildId eindeutig, nicht discordId allein.
export interface IUser extends Document {
  discordId: string;
  guildId: string;

  xp: number;
  level: number;

  totalPagesRead: number;
  totalBooksFinished: number;
  totalSprintsCompleted: number;

  currentStreak: number;
  longestStreak: number;
  lastSprintDate?: Date;

  achievements: Types.ObjectId[]; // Referenzen auf Achievement-Dokumente

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    discordId: { type: String, required: true },
    guildId: { type: String, required: true },

    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },

    totalPagesRead: { type: Number, default: 0 },
    totalBooksFinished: { type: Number, default: 0 },
    totalSprintsCompleted: { type: Number, default: 0 },

    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastSprintDate: { type: Date },

    achievements: [{ type: Schema.Types.ObjectId, ref: "Achievement" }],
  },
  { timestamps: true }
);

// Eindeutiger Index, damit pro Server + Discord-User nur ein Dokument existiert.
UserSchema.index({ discordId: 1, guildId: 1 }, { unique: true });

export const User = model<IUser>("User", UserSchema);
