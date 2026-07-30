import { Schema, model, Document } from "mongoose";
import { BookFormat } from "../../types";

// Persönliche Bibliothek eines Nutzers. Wird beim erneuten Sprint-Beitritt
// vorgeschlagen, damit Titel/Gesamtseiten/-dauer nicht jedes Mal neu
// eingegeben werden müssen.
export interface IBook extends Document {
  userId: string; // discordId
  guildId: string;

  title: string;
  format: BookFormat;

  // physical & ebook
  totalPages?: number;
  // audiobook
  totalMinutes?: number;

  isFinished: boolean;
  finishedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
  {
    userId: { type: String, required: true },
    guildId: { type: String, required: true },

    title: { type: String, required: true, trim: true },
    format: { type: String, enum: ["physical", "ebook", "audiobook"], default: "physical" },

    totalPages: { type: Number },
    totalMinutes: { type: Number },

    isFinished: { type: Boolean, default: false },
    finishedAt: { type: Date },
  },
  { timestamps: true }
);

BookSchema.index({ userId: 1, guildId: 1 });

export const Book = model<IBook>("Book", BookSchema);
