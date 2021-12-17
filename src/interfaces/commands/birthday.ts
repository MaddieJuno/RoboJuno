import { ApplicationCommandOptionType } from "../../../deps.ts";
import type { ApplicationCommandPartial } from "../../../deps.ts";

export class Command {
	public static readonly command: ApplicationCommandPartial = {
		name: "geburtstag",
		description: "Wer hat wann Geburtstag?",
		defaultPermission: true,
		options: [
			{
				type: ApplicationCommandOptionType.SUB_COMMAND,
				name: "eintrag",
				description: "Trage deinen Geburtstag in die Liste ein.",
				options: [
					{
						type: ApplicationCommandOptionType.INTEGER,
						name: "tag",
						description: "Der Tag des Monats",
						required: true
					},
					{
						type: ApplicationCommandOptionType.INTEGER,
						name: "monat",
						description: "Der Geburtsmonat",
						required: true
					},
					{
						type: ApplicationCommandOptionType.INTEGER,
						name: "jahr",
						description: "Dein Geburtsjahr",
						required: false
					}
				]
			},
			{
				type: ApplicationCommandOptionType.SUB_COMMAND,
				name: "wann",
				description: "Wann hat wer Geburtstag?",
				options: [
					{
						type: ApplicationCommandOptionType.USER,
						name: "mitglied",
						description: "Wessen Geburtstag willst du wissen?",
						required: false
					}
				]
			},
			{
				type: ApplicationCommandOptionType.SUB_COMMAND,
				name: "entfernen",
				description: "Lösche den Eintrag aus der Datenbank.",
				options: [
					{
						type: ApplicationCommandOptionType.USER,
						name: "mitglied",
						description: "Lösche den Eintrag eines anderen Mitgliedes.",
						required: false
					}
				]
			}
		]
	};
}
