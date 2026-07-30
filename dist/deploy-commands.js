"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
require("dotenv/config");
/**
 * Registriert alle Slash Commands aus src/commands bei Discord.
 * Separates Skript statt Teil von index.ts, da die Registrierung nur bei
 * Command-Änderungen nötig ist, nicht bei jedem Bot-Start.
 * Ausführen mit: npm run deploy-commands
 */
async function deployCommands() {
    const commandsPath = (0, path_1.join)(__dirname, "commands");
    const commandFiles = (0, fs_1.readdirSync)(commandsPath).filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
    const commands = commandFiles.map((file) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const command = require((0, path_1.join)(commandsPath, file));
        return command.data.toJSON();
    });
    const rest = new discord_js_1.REST().setToken(process.env.DISCORD_TOKEN);
    await rest.put(discord_js_1.Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log(`[Deploy] ${commands.length} Command(s) erfolgreich registriert.`);
}
deployCommands().catch((error) => console.error("[Deploy] Fehler:", error));
