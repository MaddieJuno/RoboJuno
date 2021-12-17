import {
	ConsoleHandler,
	FileHandler,
	log,
	LogRecord,
 } from "../deps.ts";
import {
 ConfigManager,
} from "./managers/configmanager.ts";
import {
	LogFormatter,
} from "./modules/logging/formatter.ts";
import {
	DiscordHandler,
} from "./modules/logging/discordhandler.ts";
import {
	DiscordBot,
} from "./discord.ts";

export class RoboJuno {
	private discord: DiscordBot | undefined;

	public constructor () {
		log.setup({
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
		}).then((): void => {
			this.discord = new DiscordBot(ConfigManager.get().discord.token);

			log.getLogger("System").info("App is running!");
		});
	}
}
