import type { ApplicationCommandPartial } from "../../../deps.ts";

export class Command {
	public static readonly command: ApplicationCommandPartial = {
		name: "version",
		description: "Finde die aktuelle Version des Bots.",
		defaultPermission: true
	};
}
