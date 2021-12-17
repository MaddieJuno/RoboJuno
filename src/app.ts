import {
	ConsoleHandler,
	FileHandler,
	log,
	LogRecord,

	cron,
} from "../deps.ts";

import { LogFormatter } from "./modules/logging/formatter.ts";
import { DiscordHandler } from "./modules/logging/handlers.ts";

import { ConfigManager } from "./managers/configmanager.ts";
import { DiscordBot } from "./discord.ts";

Deno.mkdirSync("logs", { recursive: true });
Deno.mkdirSync("var", { recursive: true });
Deno.mkdirSync("var/conf", { recursive: true });
Deno.mkdirSync("var/db", { recursive: true });
try {
	Deno.statSync("var/conf/config.json");
}
catch (error) {
	if (error && error.kind === Deno.errors.NotFound)
		Deno.writeTextFileSync("var/conf/config.json", "{}", { create: true });
	else
		throw error;
}

async function logSetup(): Promise<void> {
	await log.setup({
		handlers: {
			console: new ConsoleHandler("DEBUG", { formatter: (logRecord: LogRecord): string => LogFormatter.format(logRecord) }),
			file: new FileHandler("DEBUG", { filename: `logs/WhBot_${LogFormatter.formatDate(new Date(), { file: true })}.log`, formatter: (logRecord: LogRecord): string => LogFormatter.format(logRecord) }),
			discord: new DiscordHandler("DEBUG", { formatter: (logRecord: LogRecord): string => LogFormatter.format(logRecord) })
		},
		loggers: {
			System: {
				level: "DEBUG",
				handlers: ["console", "file", "discord"]
			},
			Database: {
				level: "DEBUG",
				handlers: ["console", "file", "discord"]
			},
			API: {
				level: "DEBUG",
				handlers: ["console", "file", "discord"]
			},
			Discord: {
				level: "DEBUG",
				handlers: ["console", "file", "discord"]
			},
			Twitch: {
				level: "DEBUG",
				handlers: ["console", "file", "discord"]
			},
		}
	});
}

cron("0 0 0 * * *", async (): Promise<void> => await logSetup());
await logSetup();

const _bot: DiscordBot = new DiscordBot(ConfigManager.get().discord.token);
log.getLogger("System").info("App is running!");
