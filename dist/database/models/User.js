"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    discordId: { type: String, required: true },
    guildId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    totalPagesRead: { type: Number, default: 0 },
    totalMinutesRead: { type: Number, default: 0 },
    totalBooksFinished: { type: Number, default: 0 },
    totalSprintsCompleted: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastSprintDate: { type: Date },
    achievements: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Achievement" }],
}, { timestamps: true });
// Eindeutiger Index, damit pro Server + Discord-User nur ein Dokument existiert.
UserSchema.index({ discordId: 1, guildId: 1 }, { unique: true });
exports.User = (0, mongoose_1.model)("User", UserSchema);
