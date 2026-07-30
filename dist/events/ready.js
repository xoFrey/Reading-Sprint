"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.once = exports.name = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const scheduler_1 = require("../jobs/scheduler");
exports.name = discord_js_1.Events.ClientReady;
exports.once = true;
function execute(client) {
    console.log(`[Bot] Eingeloggt als ${client.user.tag}`);
    (0, scheduler_1.startScheduler)(client);
}
