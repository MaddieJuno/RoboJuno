import { ApplicationCommandOptionType } from "../../../deps.ts";
import type { ApplicationCommandPartial } from "../../../deps.ts";

export class Command {
	public static readonly command: ApplicationCommandPartial = {
		name: "minigame",
		description: "Spiele ein Minispiel!",
		defaultPermission: true,
		options: [
			{
				type: ApplicationCommandOptionType.SUB_COMMAND,
				name: "schnickschnackschnuck",
				description: "Spiele Schere, Stein, Papier gegen jemanden!",
				options: [
					{
						type: ApplicationCommandOptionType.USER,
						name: "mitglied",
						description: "Wen möchtest du herausfordern?",
						required: true
					}
				]
			}
		]
	};
}
