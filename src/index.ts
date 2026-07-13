import { Client, GatewayIntentBits, Collection } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import "dotenv/config";
import { connectDatabase } from "./database/connection";

async function main(): Promise<void> {
  await connectDatabase(process.env.MONGODB_URI!);

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  }) as Client & { commands: Collection<string, any> };

  client.commands = new Collection();

  // Commands laden (jede Datei exportiert { data, execute }).
  const commandsPath = join(__dirname, "commands");
  for (const file of readdirSync(commandsPath)) {
    if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const command = require(join(commandsPath, file));
    client.commands.set(command.data.name, command);
  }

  // Events laden (jede Datei exportiert { name, once, execute }).
  const eventsPath = join(__dirname, "events");
  for (const file of readdirSync(eventsPath)) {
    if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const event = require(join(eventsPath, file));
    if (event.once) {
      client.once(event.name, event.execute);
    } else {
      client.on(event.name, event.execute);
    }
  }

  await client.login(process.env.DISCORD_TOKEN);
}

main().catch((error) => {
  console.error("[Bot] Kritischer Fehler beim Start:", error);
  process.exit(1);
});
