import {
	BaseHandler as Handler,
	LogLevels,
} from "../../../deps.ts";
import type { LogRecord } from "../../../deps.ts";
import { ConfigManager } from "../../managers/configmanager.ts";

export class DiscordHandler extends Handler {
	public format (logRecord: LogRecord): string {
		const message: string = logRecord.level !== LogLevels.DEBUG ? super.format(logRecord) : "DEBUG";
		return message;
	}

	public async log (message: string): Promise<void> {
		if (message !== "DEBUG") {
			message = `\`${message.length <= 1998 ? message.substr(0, 1998) : message.substr(0, 1997) + "…"}\``;
			if (ConfigManager.get().logging.discord.logAction.token)
				await fetch(`https://discord.com/api/webhooks/${ConfigManager.get().logging.discord.logAction.id}/${ConfigManager.get().logging.discord.logAction.token}`, { method: "POST", body: JSON.stringify({ content: message, username: "LinkProtection" }), headers: { "Content-Type": "application/json" } });
			/*else
				await sendMessage(ConfigManager.get().discord.memberAdd.id, { content: message });*/
		}
	}
}
