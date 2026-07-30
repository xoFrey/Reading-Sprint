"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Baut die Verbindung zur MongoDB-Datenbank auf.
 * Wird einmalig beim Bot-Start (index.ts) aufgerufen.
 */
async function connectDatabase(uri) {
    mongoose_1.default.set("strictQuery", true);
    try {
        await mongoose_1.default.connect(uri);
        console.log("[Database] Verbindung zu MongoDB erfolgreich hergestellt.");
    }
    catch (error) {
        console.error("[Database] Verbindung fehlgeschlagen:", error);
        process.exit(1);
    }
}
