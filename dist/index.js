"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
require("dotenv/config");
const connection_1 = require("./database/connection");
async function main() {
    await (0, connection_1.connectDatabase)(process.env.MONGODB_URI);
    const client = new discord_js_1.Client({
        intents: [discord_js_1.GatewayIntentBits.Guilds],
    });
    client.commands = new discord_js_1.Collection();
    // Commands laden (jede Datei exportiert { data, execute }).
    const commandsPath = (0, path_1.join)(__dirname, "commands");
    for (const file of (0, fs_1.readdirSync)(commandsPath)) {
        if (!file.endsWith(".ts") && !file.endsWith(".js"))
            continue;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const command = require((0, path_1.join)(commandsPath, file));
        client.commands.set(command.data.name, command);
    }
    // Events laden (jede Datei exportiert { name, once, execute }).
    const eventsPath = (0, path_1.join)(__dirname, "events");
    for (const file of (0, fs_1.readdirSync)(eventsPath)) {
        if (!file.endsWith(".ts") && !file.endsWith(".js"))
            continue;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const event = require((0, path_1.join)(eventsPath, file));
        if (event.once) {
            client.once(event.name, event.execute);
        }
        else {
            client.on(event.name, event.execute);
        }
    }
    await client.login(process.env.DISCORD_TOKEN);
}
main().catch((error) => {
    console.error("[Bot] Kritischer Fehler beim Start:", error);
    process.exit(1);
});
