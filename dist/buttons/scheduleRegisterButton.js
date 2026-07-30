"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const ScheduledSprint_1 = require("../database/models/ScheduledSprint");
const panelService_1 = require("../services/panelService");
// Toggle statt zwei separater Buttons (Anmelden/Abmelden): reduziert die
// Anzahl der Buttons im Panel, was angesichts des Discord-Limits (5 pro Reihe)
// bei mehreren gleichzeitig geplanten Sprints wichtig ist.
async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [scheduledSprintId] = args;
    const scheduled = await ScheduledSprint_1.ScheduledSprint.findById(scheduledSprintId);
    if (!scheduled) {
        await interaction.editReply({ content: texts_1.Texts.errors.generic });
        return;
    }
    const userId = interaction.user.id;
    const alreadyRegistered = scheduled.registeredUsers.includes(userId);
    if (alreadyRegistered) {
        scheduled.registeredUsers = scheduled.registeredUsers.filter((id) => id !== userId);
    }
    else {
        scheduled.registeredUsers.push(userId);
    }
    await scheduled.save();
    await interaction.editReply({
        content: alreadyRegistered ? texts_1.Texts.scheduleRegister.unregistered : texts_1.Texts.scheduleRegister.registered,
    });
    // Panel aktualisieren, damit die angezeigte Anzahl Angemeldeter stimmt.
    await (0, panelService_1.refreshPanel)(interaction.client, interaction.guildId);
}
