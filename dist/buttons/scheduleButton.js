"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
// Zeigt das Modal zum Planen eines Sprints. Die eigentliche Verarbeitung
// der Eingaben (inkl. Berechnung der Dauer aus Start-/Endzeit) passiert im
// zugehörigen Modal-Handler (modals/scheduleModal.ts).
async function execute(interaction) {
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId(constants_1.CustomId.MODAL_SCHEDULE)
        .setTitle(texts_1.Texts.schedule.modalTitle);
    const dateInput = new discord_js_1.TextInputBuilder()
        .setCustomId("date")
        .setLabel(texts_1.Texts.schedule.dateLabel)
        .setPlaceholder("z.B. 24.12.2026")
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    const startTimeInput = new discord_js_1.TextInputBuilder()
        .setCustomId("startTime")
        .setLabel(texts_1.Texts.schedule.startTimeLabel)
        .setPlaceholder("z.B. 20:00")
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    const endTimeInput = new discord_js_1.TextInputBuilder()
        .setCustomId("endTime")
        .setLabel(texts_1.Texts.schedule.endTimeLabel)
        .setPlaceholder("z.B. 21:30")
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true);
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(dateInput), new discord_js_1.ActionRowBuilder().addComponents(startTimeInput), new discord_js_1.ActionRowBuilder().addComponents(endTimeInput));
    await interaction.showModal(modal);
}
