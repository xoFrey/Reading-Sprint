"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.once = exports.name = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const router_1 = require("../interactions/router");
const texts_1 = require("../config/texts");
exports.name = discord_js_1.Events.InteractionCreate;
exports.once = false;
async function execute(interaction) {
    const client = interaction.client;
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command)
            return;
        try {
            await command.execute(interaction);
        }
        catch (error) {
            console.error(`[InteractionCreate] Fehler in Command "${interaction.commandName}":`, error);
            const payload = { content: texts_1.Texts.errors.generic, ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(payload).catch(() => undefined);
            }
            else {
                await interaction.reply(payload).catch(() => undefined);
            }
        }
        return;
    }
    if (interaction.isButton()) {
        await (0, router_1.routeButton)(interaction);
        return;
    }
    if (interaction.isModalSubmit()) {
        await (0, router_1.routeModal)(interaction);
        return;
    }
    if (interaction.isStringSelectMenu()) {
        await (0, router_1.routeSelect)(interaction);
        return;
    }
}
