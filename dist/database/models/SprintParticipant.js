"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SprintParticipant = void 0;
const mongoose_1 = require("mongoose");
// Ein Buch kann physisch (Seiten), Ebook (Prozent) oder Hörbuch (Minuten)
// sein - je nach `format` werden nur die passenden Felder befüllt (siehe
// services/bookProgress.ts für die zugehörige Berechnungs-/Anzeigelogik).
const ParticipantBookSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    format: { type: String, enum: ["physical", "ebook", "audiobook"], required: true },
    totalPages: { type: Number },
    startPage: { type: Number },
    currentPage: { type: Number },
    goalPage: { type: Number },
    startPercent: { type: Number },
    currentPercent: { type: Number },
    goalPercent: { type: Number },
    totalMinutes: { type: Number },
    startMinutes: { type: Number },
    currentMinutes: { type: Number },
    goalMinutes: { type: Number },
    isFinished: { type: Boolean, default: false },
}, { _id: false } // Bücher brauchen keine eigene ID, sie sind reine Sub-Dokumente
);
const SprintParticipantSchema = new mongoose_1.Schema({
    sprintId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Sprint", required: true },
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    books: { type: [ParticipantBookSchema], default: [] },
    status: {
        type: String,
        enum: ["active", "paused", "left"],
        default: "active",
    },
    xpEarned: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
    pausedAt: { type: Date },
    totalPausedMs: { type: Number, default: 0 },
});
// Ein Nutzer kann pro Sprint nur einmal teilnehmen.
SprintParticipantSchema.index({ sprintId: 1, userId: 1 }, { unique: true });
exports.SprintParticipant = (0, mongoose_1.model)("SprintParticipant", SprintParticipantSchema);
