import { ApplicationCommandOptionType } from "../../../deps.ts";
import type { ApplicationCommandPartial } from "../../../deps.ts";

export class Command {
	public static readonly strikeCommand: ApplicationCommandPartial = {
		name: "strike",
		description: "Gib einem Mitglied einen Strike. Beim Dritten wird das Mitglied gekickt und beim Sechsten gebannt.",
		defaultPermission: false,
		options: [
			{
				type: ApplicationCommandOptionType.USER,
				name: "member",
				description: "Zu verwarnendes Mitglied",
				required: true
			},
			{
				type: ApplicationCommandOptionType.STRING,
				name: "reason",
				description: "Aus welchem Grund bekommt das Mitglied einen Strike?",
				required: false
			}
		]
	};
	public static readonly strikesCommand: ApplicationCommandPartial = {
		name: "strikes",
		description: "Wie viele Strikes hast du schon?",
		defaultPermission: true,
		options: [
			{
				type: ApplicationCommandOptionType.USER,
				name: "member",
				description: "Strikes dieses Mitgliedes",
				required: false
			}
		]
	};
}
