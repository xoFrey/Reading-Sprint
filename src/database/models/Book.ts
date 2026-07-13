import { Schema, model, Document } from "mongoose";

// Persönliche Bibliothek eines Nutzers. Wird beim erneuten Sprint-Beitritt
// vorgeschlagen, damit Titel/Seitenzahl nicht jedes Mal neu eingegeben werden müssen.
export interface IBook extends Document {
  userId: string; // discordId
  guildId: string;

  title: string;
  totalPages: number;

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
    totalPages: { type: Number, required: true },

    isFinished: { type: Boolean, default: false },
    finishedAt: { type: Date },
  },
  { timestamps: true }
);

BookSchema.index({ userId: 1, guildId: 1 });

export const Book = model<IBook>("Book", BookSchema);
