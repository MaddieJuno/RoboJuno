import {
	ApplicationCommandInteraction,
	MessageComponentData,
} from "../../deps.ts";
import { ConfigManager } from "../managers/configmanager.ts";
import {
	Colors,
	DiscordEmbed,
} from "../managers/discordembedmanager.ts";

export class MiniGames {
	public static async onSchnickSchnackSchnuck (interaction: ApplicationCommandInteraction): Promise<void> {
		if (!this.isChannelCorrect(interaction.channel?.id)) {
			interaction.reply({ content: `Beschränke Minispiele bitte nur auf den <#${ConfigManager.get().discord.gameChannel}>, damit der Chat hier übersichtlich bleibt.`, ephemeral: true });
			return;
		}
		for (const game of JSON.parse(Deno.readTextFileSync("var/db/minispiele.json")).rps) {
			if ((game.challenger.id === interaction.user.id || game.challenged.id === interaction.user.id) && (game.challenger.id === interaction.options[0].value || game.challenged.id === interaction.options[0].value)) {
				interaction.reply({ content: "Zwischen euch beiden läuft bereits ein Spiel. Beende erst das Andere!", ephemeral: true });
				return;
			}
		}

		const embed = new DiscordEmbed({ color: Colors.LightGreen, title: "__**Schere, Stein, Papier**__" });
		embed.setDescription("Bitte wählt beide unten eure Figur. Ihr könnt nur einmal wählen.\nDas Spiel läuft nach einer Minute ab.\n\n__Die **Regeln**:__");
		embed.addField("✂️ Schere", "☑️ Papier\n❌ Stein", true);
		embed.addField("🪨 Stein", "☑️ Schere\n❌ Papier", true);
		embed.addField("📑 Papier", "☑️ Stein\n❌ Schere", true);

		const buttons: MessageComponentData = {
			type: "ACTION_ROW",
			components: [
				{
					type: "BUTTON",
					style: "PRIMARY",
					label: "Schere",
					emoji: { name: "✂️" },
					customID: `rockpaperscissors|${interaction.user.id}|${interaction.options[0].value}|scissors`
				},
				{
					type: "BUTTON",
					style: "PRIMARY",
					label: "Stein",
					emoji: { name: "🪨" },
					customID: `rockpaperscissors|${interaction.user.id}|${interaction.options[0].value}|rock`
				},
				{
					type: "BUTTON",
					style: "PRIMARY",
					label: "Papier",
					emoji: { name: "📑" },
					customID: `rockpaperscissors|${interaction.user.id}|${interaction.options[0].value}|paper`
				}
			]
		};
		const message = await interaction.reply({ content: `${interaction.user} hat <@${interaction.options[0].value}> zu einer Runde ***Schere, Stein, Papier*** eingeladen!\nTrefft jetzt eure Auswahl!`, embeds: [embed.toJSON()], components: [buttons] });
		const id = setTimeout(() => {
			if (buttons.components) {
				buttons.components[0].disabled = true;
				buttons.components[1].disabled = true;
				buttons.components[2].disabled = true;
			}
			message.editResponse({ content: `Das Spiel zwischen ${interaction.user} und <@${interaction.options[0].value}> ist leider abgelaufen.\nFordert euch erneut heraus!`, components: [buttons] });
			const games = JSON.parse(Deno.readTextFileSync("var/db/minispiele.json"));
			const arr = [];
			for (const game of games.rps) {
				if (!(game.challenger.id === interaction.user.id && game.challenged.id === interaction.options[0].value)) arr.push(game);
			}
			games.rps = arr;
			Deno.writeTextFileSync("var/db/minispiele.json", JSON.stringify(games));
		}, 60000);

		const games = JSON.parse(Deno.readTextFileSync("var/db/minispiele.json"));
		games.rps.push({ id: id, challenger: { id: interaction.user.id }, challenged: { id: interaction.options[0].value } });
		Deno.writeTextFileSync("var/db/minispiele.json", JSON.stringify(games));
	}

	public static async onTicTacToe (interaction: ApplicationCommandInteraction): Promise<void> {
		if (!this.isChannelCorrect(interaction.channel?.id)) {
			interaction.reply({ content: `Beschränke Minispiele bitte nur auf den <#${ConfigManager.get().discord.gameChannel}>, damit der Chat hier übersichtlich bleibt.`, ephemeral: true });
			return;
		}
		for (const game of JSON.parse(Deno.readTextFileSync("var/db/minispiele.json")).ttt) {
			if ((game.challenger.id === interaction.user.id || game.challenged.id === interaction.user.id) && (game.challenger.id === interaction.options[0].value || game.challenged.id === interaction.options[0].value)) {
				interaction.reply({ content: "Zwischen euch beiden läuft bereits ein Spiel. Beende erst das Andere!", ephemeral: true });
				return;
			}
		}

		const embed = new DiscordEmbed({ color: Colors.LightGreen, title: "__**Tic-Tac-Toe**__" });
		embed.setDescription(`Ziel des Spiels ist es als erster Spieler drei in einer Reihe zu vervollständigen. Entweder in einer Zeile, einer Spalte oder auch diagonal.\nIhr spielt abwechselnd.\n<@${interaction.options[0].value}>: :x: (beginnt)\n<@${interaction.user.id}>: :o:\n\nDas Spiel läuft nach 5 Minuten nach dem letzten Zug ab.`);
		embed.addField("__Aktueller Spieler:__", `<@${interaction.options[0].value}>`, false);

		const upButtons: MessageComponentData = {
			type: "ACTION_ROW",
			components: [
				{
					type: "BUTTON",
					style: "SECONDARY",
					emoji: { name: "⬛" },
					customID: `tictactoe|${interaction.user.id}|${interaction.options[0].value}|0|0`
				},
				{
					type: "BUTTON",
					style: "SECONDARY",
					emoji: { name: "⬛" },
					customID: `tictactoe|${interaction.user.id}|${interaction.options[0].value}|0|1`
				},
				{
					type: "BUTTON",
					style: "SECONDARY",
					emoji: { name: "⬛" },
					customID: `tictactoe|${interaction.user.id}|${interaction.options[0].value}|0|2`
				}
			]
		};
		const middleButtons: MessageComponentData = {
			type: "ACTION_ROW",
			components: [
				{
					type: "BUTTON",
					style: "SECONDARY",
					emoji: { name: "⬛" },
					customID: `tictactoe|${interaction.user.id}|${interaction.options[0].value}|1|0`
				},
				{
					type: "BUTTON",
					style: "SECONDARY",
					emoji: { name: "⬛" },
					customID: `tictactoe|${interaction.user.id}|${interaction.options[0].value}|1|1`
				},
				{
					type: "BUTTON",
					style: "SECONDARY",
					emoji: { name: "⬛" },
					customID: `tictactoe|${interaction.user.id}|${interaction.options[0].value}|1|2`
				}
			]
		};
		const downButtons: MessageComponentData = {
			type: "ACTION_ROW",
			components: [
				{
					type: "BUTTON",
					style: "SECONDARY",
					emoji: { name: "⬛" },
					customID: `tictactoe|${interaction.user.id}|${interaction.options[0].value}|2|0`
				},
				{
					type: "BUTTON",
					style: "SECONDARY",
					emoji: { name: "⬛" },
					customID: `tictactoe|${interaction.user.id}|${interaction.options[0].value}|2|1`
				},
				{
					type: "BUTTON",
					style: "SECONDARY",
					emoji: { name: "⬛" },
					customID: `tictactoe|${interaction.user.id}|${interaction.options[0].value}|2|2`
				}
			]
		};
		const buttons = [upButtons, middleButtons, downButtons];
		const message = await interaction.reply({ content: `${interaction.user} hat <@${interaction.options[0].value}> zu einer Runde ***Tic-Tac-Toe*** eingeladen!`, embeds: [embed.toJSON()], components: buttons });

		const id = setTimeout(() => {
			for (const row of buttons) {
				if (row.components) {
					for (const button of row.components) {
						button.disabled = true;
					}
				}
			}
			embed.getFields()[0].name = "__Spiel vorbei!__";
			embed.getFields()[0].value = "Die zeit ist abgelaufen!";
			message.editResponse({ content: `Das Spiel zwischen ${interaction.user} und <@${interaction.options[0].value}> ist leider abgelaufen.\nFordert euch erneut heraus!`, embeds: [embed.toJSON()], components: buttons });
			const games = JSON.parse(Deno.readTextFileSync("var/db/minispiele.json"));
			const arr = [];
			for (const game of games.ttt) {
				if (!(game.challenger.id === interaction.user.id && game.challenged.id === interaction.options[0].value)) arr.push(game);
			}
			games.ttt = arr;
			Deno.writeTextFileSync("var/db/minispiele.json", JSON.stringify(games));
		}, 300000);

		const games = JSON.parse(Deno.readTextFileSync("var/db/minispiele.json"));
		games.ttt.push({ id, challenger: { id: interaction.user.id, choices: [] }, challenged: { id: interaction.options[0].value, choices: [] }, last: interaction.user.id });
		Deno.writeTextFileSync("var/db/minispiele.json", JSON.stringify(games));
	}

	private static isChannelCorrect (id = ""): boolean {
		return id === ConfigManager.get().discord.gameChannel;
	}
}
