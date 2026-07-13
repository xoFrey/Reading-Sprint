import { Client, Events, Interaction } from "discord.js";
import { routeButton, routeModal } from "../interactions/router";
import { Texts } from "../config/texts";

export const name = Events.InteractionCreate;
export const once = false;

export async function execute(interaction: Interaction): Promise<void> {
  const client = interaction.client as Client & {
    commands: Map<string, { execute: (i: Interaction) => Promise<void> }>;
  };

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`[InteractionCreate] Fehler in Command "${interaction.commandName}":`, error);
      const payload = { content: Texts.errors.generic, ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => undefined);
      } else {
        await interaction.reply(payload).catch(() => undefined);
      }
    }
    return;
  }

  if (interaction.isButton()) {
    await routeButton(interaction);
    return;
  }

  if (interaction.isModalSubmit()) {
    await routeModal(interaction);
    return;
  }
}
