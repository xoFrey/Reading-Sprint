import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import "dotenv/config";

/**
 * Registriert alle Slash Commands aus src/commands bei Discord.
 * Separates Skript statt Teil von index.ts, da die Registrierung nur bei
 * Command-Änderungen nötig ist, nicht bei jedem Bot-Start.
 * Ausführen mit: npm run deploy-commands
 */
async function deployCommands(): Promise<void> {
  const commandsPath = join(__dirname, "commands");
  const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  const commands = commandFiles.map((file) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const command = require(join(commandsPath, file));
    return command.data.toJSON();
  });

  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), { body: commands });
  console.log(`[Deploy] ${commands.length} Command(s) erfolgreich registriert.`);
}

deployCommands().catch((error) => console.error("[Deploy] Fehler:", error));
