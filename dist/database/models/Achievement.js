"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Achievement = void 0;
const mongoose_1 = require("mongoose");
const AchievementSchema = new mongoose_1.Schema({
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "🏅" },
    xpReward: { type: Number, default: 0 },
    roleReward: { type: String },
    condition: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});
exports.Achievement = (0, mongoose_1.model)("Achievement", AchievementSchema);
