import {
	BaseHandler as Handler,
	LogLevels,
} from "../../../deps.ts"
import type{
	LogRecord,
} from "../../../deps.ts";
import {
	black,
	bold,
	brightBlue,
	brightGreen,
	brightRed,
	brightYellow,
	inverse,
	red,
} from "../../../deps.ts";

export class ConsoleHandler extends Handler {
	public format (logRecord: LogRecord): string {
		let message: string = super.format(logRecord);

		switch (logRecord.level) {
			case LogLevels.DEBUG:
				message = brightGreen(message);
				break;
			case LogLevels.INFO:
				message = brightBlue(message);
				break;
			case LogLevels.WARNING:
				message = brightYellow(message);
				break;
			case LogLevels.ERROR:
				message = brightRed(message);
				break;
			case LogLevels.CRITICAL:
				// message = bold(brightRed(message));
				message = brightRed(inverse(message));
				break;
			default:
				break;
		}

		return message;
	}

	public log (message: string): void {
		console.log(message);
	}
}
