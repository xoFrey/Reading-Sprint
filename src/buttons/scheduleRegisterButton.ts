import { ButtonInteraction } from "discord.js";
import { parseCustomId } from "../config/constants";
import { Texts } from "../config/texts";
import { ScheduledSprint } from "../database/models/ScheduledSprint";
import { refreshPanel } from "../services/panelService";

// Toggle statt zwei separater Buttons (Anmelden/Abmelden): reduziert die
// Anzahl der Buttons im Panel, was angesichts des Discord-Limits (5 pro Reihe)
// bei mehreren gleichzeitig geplanten Sprints wichtig ist.
export async function execute(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const { args } = parseCustomId(interaction.customId);
  const [scheduledSprintId] = args;

  const scheduled = await ScheduledSprint.findById(scheduledSprintId);
  if (!scheduled) {
    await interaction.editReply({ content: Texts.errors.generic });
    return;
  }

  const userId = interaction.user.id;
  const alreadyRegistered = scheduled.registeredUsers.includes(userId);

  if (alreadyRegistered) {
    scheduled.registeredUsers = scheduled.registeredUsers.filter((id) => id !== userId);
  } else {
    scheduled.registeredUsers.push(userId);
  }
  await scheduled.save();

  await interaction.editReply({
    content: alreadyRegistered ? Texts.scheduleRegister.unregistered : Texts.scheduleRegister.registered,
  });

  // Panel aktualisieren, damit die angezeigte Anzahl Angemeldeter stimmt.
  await refreshPanel(interaction.client, interaction.guildId!);
}
