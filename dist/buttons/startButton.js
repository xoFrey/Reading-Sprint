"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const texts_1 = require("../config/texts");
// Kein DB-Aufruf vor showModal (siehe joinButton.ts für die Begründung).
// Die Prüfung auf einen bereits aktiven Sprint passiert stattdessen in
// modals/startModal.ts, direkt nach dem sofortigen deferReply().
async function execute(interaction) {
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId("modal_start") // eigenes, einfaches Modal - nur ein Feld
        .setTitle(texts_1.Texts.start.modalTitle);
    const endTimeInput = new discord_js_1.TextInputBuilder()
        .setCustomId("endTime")
        .setLabel(texts_1.Texts.start.endTimeLabel)
        .setPlaceholder("z.B. 21:30")
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(endTimeInput));
    await interaction.showModal(modal);
}
