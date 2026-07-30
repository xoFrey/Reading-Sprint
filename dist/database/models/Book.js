"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Book = void 0;
const mongoose_1 = require("mongoose");
const BookSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    format: { type: String, enum: ["physical", "ebook", "audiobook"], default: "physical" },
    totalPages: { type: Number },
    totalMinutes: { type: Number },
    isFinished: { type: Boolean, default: false },
    finishedAt: { type: Date },
}, { timestamps: true });
BookSchema.index({ userId: 1, guildId: 1 });
exports.Book = (0, mongoose_1.model)("Book", BookSchema);
