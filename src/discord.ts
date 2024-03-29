import {
	ApplicationCommandInteraction,
	AuditLogEntry,
	AuditLogEvents,
	Client,
	cron,
	event,
	Guild,
	Intents,
	slash,
	subslash,
	TextChannel,
	ThreadChannel,
	User,

	log,
MessageComponentData,
Interaction,
} from "../deps.ts";
import type {
	ClientOptions,
	Member,
	Message,
	Role,
} from "../deps.ts";

import { LogFormatter } from "./modules/logging/formatter.ts";
import { ConfigManager } from "./managers/configmanager.ts";
import {
	Colors,
	DiscordEmbed,
} from "./managers/discordembedmanager.ts";
import { InstacordChecker } from "./modules/instacord.ts";

import {
	BirthdayCommand,
	MinigameCommand,
	StrikeCommand,
	VersionCommand,
} from "./interfaces/commands/commands.ts";
import { MiniGames } from "./modules/minigames.ts";

interface BotOptions extends ClientOptions {
	syncCommands?: boolean;
}

export class DiscordBot extends Client {
	private syncCommands: boolean;
	private readonly VERSION = "v1.2.7.22";
	private preCounter = 0;
	private isPre = false;

	public static guild: Guild | undefined;
	private nonCountedMembers: string[] = [
		"344136468068958218", // Till Gitter
		"372108947303301124", // Lord Bahn
	];

	public constructor (token: string, options?: BotOptions) {
		super(options);
		this.syncCommands = options?.syncCommands || false;

		this.connect(token, Intents.All);
		this.presence.setStatus("dnd");
		this.presence.setActivity({ name: "Develeon64", type: "WATCHING" });
	}

	@event("ready")
	public async onReady (shard: number): Promise<void> {
		log.getLogger("Discord").info(`Bot is ready on Shard ${shard} and is online!`);
		DiscordBot.guild = await this.guilds.get(ConfigManager.get().discord.guild) as Guild;
		this.updateMemberCount();

		cron("0 */5 * * * *", (): void => {
			let status: "dnd" | "idle" | "invisible" | "offline" | "online" = "online";
			let name = "Maddie Juno";
			let type: "COMPETING" | "CUSTOM_STATUS" | "LISTENING" | "PLAYING" | "STREAMING" | "WATCHING" = "LISTENING";
			let url = "https://develeon.de/";

			switch (this.preCounter) {
				case 1:
					name = "Develeon64";
					type = "WATCHING";
					if (this.isPre) {
						type = "STREAMING";
						url = "https://www.twitch.tv/develeon64";
						this.isPre = false;
					}
					else {
						this.isPre = true;
					}
					break;
				case 2:
					status = "idle";
					name = this.VERSION;
					type = "PLAYING";
					break;
				case 3:
					status = "dnd";
					name = "¡WIP!";
					type = "WATCHING";
					break;
			}

			this.setPresence({ status, activity: { name, type, url } });
			this.preCounter < 3 ? this.preCounter++ : this.preCounter = 0;

			log.getLogger("Discord").debug(`Setting status to "${status} - ${type} ${name}"`);
		});
		cron("5 5 */4 * * *", (): void => {this.updateMemberCount();});
		cron("2 0 0 * * *", (): void => { // Delete old Strikes
			const news: {[key: string]: number[]} = {};
			const strikes = JSON.parse(Deno.readTextFileSync("var/db/strikes.json"));

			for (const id in strikes) {
				const list = [];
				for (const strike of strikes[id]) {
					if (this.calcDates(new Date(strike.time).valueOf()).months < 6) list.push(strike);
				}
				if (list.length > 0) news[id] = list;
			}

			Deno.writeTextFileSync("var/db/strikes.json", JSON.stringify(news));
			log.getLogger("Discord").info("Strikes wurden überprüft");
		});
		cron("0 0 6 * * *", async (): Promise<void> => {
			const now = new Date();
			const birthdays = JSON.parse(Deno.readTextFileSync("var/db/geburtstage.json"));
			const todays: string[] = [];
			for (const birth in birthdays) {
				if (birthdays[birth].day === now.getDate() && birthdays[birth].month === now.getMonth() + 1) {
					const birthday = await (await this.guilds.resolve(ConfigManager.get().discord.guild))?.members.resolve(birth);
					if (birthday) {
						if (birthdays[birth].year) {
							todays.push(`<@${birth}> [${birthday.displayName}] (${this.calcAge(new Date(birthdays[birth].year, birthdays[birth].month - 1, birthdays[birth].day))})`);
						}
						else {
							todays.push(`<@${birth}> [${birthday.displayName}]`);
						}
					}
				}
			}

			const embed = new DiscordEmbed();
			embed.setTitle("**Heute ist Geburtstag! 🎉 🎉 🎉**");
			let births: string;
			if (todays.length === 0) return;
			else if (todays.length === 1) {
				births = todays.pop() || "";
			}
			else {
				const last = todays.pop();
				births = `${todays.join(", ")} und ${last}`;
			}
			embed.setDescription(`Heute lassen wir ${births} hoch leben und feiern den ganzen Tag!\n🎊 🎊 🎊`);
			embed.setColor(Math.floor(Math.random() * Math.pow(256, 3)));

			if (ConfigManager.get().discord.birthdayChannel.token)
				await fetch(`https://discordapp.com/api/webhooks/${ConfigManager.get().discord.birthdayChannel.id}/${ConfigManager.get().discord.birthdayChannel.token}`, { method: "POST", body: JSON.stringify({ content: "@everyone Holt eure Partyhüte raus! 🥳 🥳 🥳", embeds: [embed.toJSON()], username: "Happy Birthday" }), headers: { "Content-Type": "application/json" } });
			else
				(await DiscordBot.guild?.channels.fetch(ConfigManager.get().discord.birthdayChannel.id) as TextChannel).send("@everyone Holt eure Partyhüte raus! 🥳 🥳 🥳", embed.toEmbed());
		});

		if (this.syncCommands) {
			for (const command of (await this.interactions.commands.all())?.array() || []) {
				command.delete();
			}
			for (const command of (await (await this.guilds.resolve(ConfigManager.get().discord.guild))?.commands.all())?.array() || []) {
				command.delete();
			}

			this.interactions.commands.create(VersionCommand.command);
			this.interactions.commands.create(BirthdayCommand.command, DiscordBot.guild);
			this.interactions.commands.create(StrikeCommand.strikesCommand, DiscordBot.guild);
			this.interactions.commands.create(MinigameCommand.command, DiscordBot.guild);
			this.interactions.commands.create(StrikeCommand.strikeCommand, DiscordBot.guild);
		}
	}

	@event("guildMemberAdd")
	public onGuildMemberAdd (member: Member): void {
		const embed: DiscordEmbed = new DiscordEmbed({ title: `__${member.user.tag} ist neu gekommen!__`, color: Colors.Yellow });
		embed.setDescription(`<@${member.user.id}> (${member.user.tag}) [${member.id}]`);
		embed.setThumbnail({ url: `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` });
		embed.addField("__Erstellt__", LogFormatter.formatDate(this.calcDateFromId(member.user.id)), true);
		embed.addField("__Beitritt__", LogFormatter.formatDate(new Date()), true);
		//embed.addBlankField();
		//embed.addField("__Invites__", "Liste möglicher benutzter Invites:");

		if (ConfigManager.get().discord.memberAdd.token)
			fetch(`https://discordapp.com/api/webhooks/${ConfigManager.get().discord.memberAdd.id}/${ConfigManager.get().discord.memberAdd.token}`, { method: "POST", body: JSON.stringify({ content: "Achtung @everyone ⚠️", embeds: [embed], username: "MemberProtection" }), headers: { "Content-Type": "application/json" } });
		/*else
			await sendMessage(ConfigManager.get().discord.memberAdd.id, { content: "Achtung @everyone ⚠️", embed: embed.toJSON() });*/

		if (ConfigManager.get().discord.welcomeChannel.token)
			fetch(`https://discordapp.com/api/webhooks/${ConfigManager.get().discord.welcomeChannel.id}/${ConfigManager.get().discord.welcomeChannel.token}`, { method: "POST", body: JSON.stringify({ content: `Hallo ${member} und herzlich willkommen auf ***${member.guild.name}***!\nBevor du loslegen kannst, nimm dir bitte etwas Zeit und lies dir <#912785838407024650> durch. Bestätige diese, um dich für den Server freizuschalten.\n\nViel Spaß und ganz viel Freude! ❤️`, username: "Juno Family" }), headers: { "Content-Type": "application/json" } });

		this.updateMemberCount();
		log.getLogger("Discord").info(`Member ${member.user.tag} (${member.user.id}) joined the Guild!`);
	}

	@event("guildMemberRemove")
	public async onGuildMemberRemove (member: Member): Promise<void> {
		const removed = await this.getLeaveType(member);
		const embed: DiscordEmbed = new DiscordEmbed({ color: Colors.Red });
		embed.setDescription(member.nick ? `${member.nick} - <@${member.user.id}> (${member.user.tag}) [${member.id}]` : `<@${member.user.id}> (${member.user.tag}) [${member.id}]`);
		embed.setThumbnail({ url: `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` });
		// embed.setThumbnail({ url: avatarURL(member) });
		embed.addField("__Verlassen__", LogFormatter.formatDate(new Date()), true);
		embed.addField("__Beitritt__", LogFormatter.formatDate(new Date(member.joinedAt)), true);
		embed.addField("__Erstellt__", LogFormatter.formatDate(this.calcDateFromId(member.user.id)), true);

		if (!removed) {
			embed.setColor(Colors.Yellow);
			embed.setTitle(`__${member.user.tag} ist gegangen.__`);

			log.getLogger("Discord").info(`Member ${member.user.tag} (${member.user.id}) left the Guild!`);
		}
		else if ((removed as any).actionType === AuditLogEvents.MemberKick) {
			embed.setTitle(`__${member.user.tag} wurde gekickt!__`);
			const kicker = await DiscordBot.guild?.members.fetch(removed.userID);
			if (kicker) {
				let kickerString = `${kicker.user.tag}\n${kicker}\n${kicker.id}`;
				if (kicker.nick) kickerString = `${kicker.nick}\n${kickerString}`;
				embed.addField("__Kicker__", kickerString, true);
			}

			if (removed.reason)
				embed.addField("__Grund__", removed.reason, true);

			log.getLogger("Discord").info(`Member ${member.user.tag} (${member.user.id}) was kicked!`);
		}
		else if ((removed as any).actionType === AuditLogEvents.MemberBanAdd) {
			embed.setTitle(`__${member.user.tag} wurde gebannt!__`);
			const banner = await DiscordBot.guild?.members.fetch(removed.userID);
			if (banner) {
				let bannerString = `${banner.user.tag}\n${banner}\n${banner.id}`;
				if (banner.nick) bannerString = `${banner.nick}\n${bannerString}`;
				embed.addField("__Banner__", bannerString, true);
			}

			if (removed.reason)
				embed.addField("__Grund__", removed.reason, true);

			log.getLogger("Discord").info(`Member ${member.user.tag} (${member.user.id}) was BANNED!`);
		}

		const birthdays = JSON.parse(Deno.readTextFileSync("var/db/geburtstage.json"));
		const news: any = {};
		for (const birth in birthdays) {
			if (birth !== member.id) news[birth] = birthdays[birth];
		}
		Deno.writeTextFileSync("var/db/geburtstage.json", JSON.stringify(news, null, 2));

		if (ConfigManager.get().discord.memberAdd.token)
			fetch(`https://discordapp.com/api/webhooks/${ConfigManager.get().discord.memberAdd.id}/${ConfigManager.get().discord.memberAdd.token}`, { method: "POST", body: JSON.stringify({ content: `Achtung @${removed ? "everyone" : "here"} ⚠️`, username: "MemberProtection", embeds: [embed] }), headers: { "Content-Type": "application/json" } });
		/*else
			await sendMessage(ConfigManager.get().discord.memberAdd.id, { content: "Achtung @here ⚠️", embed: embed.toJSON() });*/
		this.updateMemberCount();
	}

	@event("guildBanRemove")
	private async onBanRemove (guild: Guild, user: User): Promise<void> {
		const embed: DiscordEmbed = new DiscordEmbed({ color: Colors.Purple });
		embed.setTitle(`__${user.tag} wurde entbannt!__`);
		embed.setDescription(`<@${user.id}> (${user.tag}) [${user.id}]`);
		embed.setThumbnail({ url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` });
		// embed.setThumbnail({ url: avatarURL(member) });
		embed.addField("__Erstellt__", LogFormatter.formatDate(this.calcDateFromId(user.id)), false);

		const auditLog = await DiscordBot.guild?.fetchAuditLog({ limit: 1, actionType: AuditLogEvents.MemberBanRemove });

		if (auditLog && (auditLog?.entries[0] as any).targetID === user.id) {
			const banner = await DiscordBot.guild?.members.fetch(auditLog?.entries[0].userID);
			if (banner) {
				let bannerString = `${banner.user.tag}\n${banner}\n${banner.id}`;
				if (banner.nick) bannerString = `${banner.nick}\n${bannerString}`;
				embed.addField("__Banner__", bannerString, true);
			}
		}

		if (ConfigManager.get().discord.memberAdd.token)
			fetch(`https://discordapp.com/api/webhooks/${ConfigManager.get().discord.memberAdd.id}/${ConfigManager.get().discord.memberAdd.token}`, { method: "POST", body: JSON.stringify({ content: `Achtung @here ⚠️`, username: "MemberProtection", embeds: [embed] }), headers: { "Content-Type": "application/json" } });

		log.getLogger("Discord").info(`User ${user.tag} (${user.id}) was unbanned!`);
	}

	@event("messageCreate")
	public onMessageCreate (message: Message): void {
		if (!message.author.bot) {
			if (InstacordChecker.checkMessage(message)) {
				InstacordChecker.actMessage(message);
			}
			else {
				if (message.channelID === ConfigManager.get().discord.instacordChannel)
					message.startThread({ name: "Kommentare", autoArchiveDuration: 60 });
			}
		}
	}

	@event("threadCreate")
	public onThreadCreate (thread: ThreadChannel): void {
		thread.join();
		/*if (this.user)
			thread.addUser(this.user.id);*/
	}

	@event("interactionCreate")
	private onInteractionCreate (interaction: Interaction): void {
		if (interaction.isMessageComponent()) {
			const args = (interaction.data as any).custom_id.split("|");
			if (interaction.user.id !== args[1] && interaction.user.id !== args[2]) {
				interaction.reply({ content: "Du kannst nicht bei einem fremden Spiel mitmachen. Wenn du selbst ein Spiel spielen möchtest, fordere jemanden heraus!\nDu erkennst Spiele, an denen du teilnehmen kannst, an einer Markierung deines Namens. Also, wenn die Nachricht gelb erscheint.", ephemeral: true });
				return;
			}

			const games = JSON.parse(Deno.readTextFileSync("var/db/minispiele.json"));
			if (args[0] === "rockpaperscissors") {
				for (const g in games.rps) {
					const game = games.rps[g];
					if (game.challenger.id === args[1] && game.challenged.id === args[2]) {
						if (interaction.user.id === game.challenger.id) {
							if (game.challenger.choice) {
								interaction.respond({ content: "Du kannst nur einmal eine Auswahl treffen!", ephemeral: true });
								return;
							}
							else {
								game.challenger.choice = game.challenger.choice || args[3];
								interaction.respond({ content: "Deine Wahl wurde aufgenommen, danke!", ephemeral: true });
							}
						}
						else {
							if (game.challenged.choice) {
								interaction.respond({ content: "Du kannst nur einmal eine Auswahl treffen!", ephemeral: true });
								return;
							}
							else {
								game.challenged.choice = game.challenged.choice || args[3];
								interaction.respond({ content: "Deine Wahl wurde aufgenommen, danke!", ephemeral: true });
							}
						}

						if (game.challenger.choice && game.challenged.choice) {
							if ((game.challenger.choice === "scissors" && game.challenged.choice === "paper") || (game.challenger.choice === "rock" && game.challenged.choice === "scissors") || (game.challenger.choice === "paper" && game.challenged.choice === "rock"))
								interaction.message.edit({ content: `__Das Spiel ist vorbei!__\nDa <@${game.challenger.id}> *${game.challenger.choice}* gewählt hat und <@${game.challenged.id}> *${game.challenged.choice}* gewählt hat, hat **<@${game.challenger.id}>** gewonnen! Herzlichen Glückwunsch!`.replaceAll("scissors", "✂️ Schere").replaceAll("rock", "🪨 Stein").replaceAll("paper", "📑 Papier"), embeds: [], components: [] });
							else if ((game.challenged.choice === "scissors" && game.challenger.choice === "paper") || (game.challenged.choice === "rock" && game.challenger.choice === "scissors") || (game.challenged.choice === "paper" && game.challenger.choice === "rock"))
								interaction.message.edit({ content: `__Das Spiel ist vorbei!__\nDa <@${game.challenger.id}> *${game.challenger.choice}* gewählt hat und <@${game.challenged.id}> *${game.challenged.choice}* gewählt hat, hat **<@${game.challenged.id}>** gewonnen! Herzlichen Glückwunsch!`.replaceAll("scissors", "✂️ Schere").replaceAll("rock", "🪨 Stein").replaceAll("paper", "📑 Papier"), embeds: [], components: [] });
							else
							interaction.message.edit({ content: `__Das Spiel ist vorbei!__\nDa sowohl <@${game.challenger.id}>, als auch <@${game.challenged.id}>, *${game.challenger.choice}* gewählt haben, steht es **unentschieden**! Veruscht es nochmals!`.replaceAll("scissors", "✂️ Schere").replaceAll("rock", "🪨 Stein").replaceAll("paper", "📑 Papier"), embeds: [], components: [] });

							clearTimeout(game.id);
							const arr = [];
							for (const a in games.rps) {
								if (a !== g) arr.push(games.rps[a]);
							}
							games.rps = arr;
						}
						Deno.writeTextFileSync("var/db/minispiele.json", JSON.stringify(games));
						break;
					}
				}
			}
			else if (args[0] === "tictactoe") {
				for (const g in games.ttt) {
					const game = games.ttt[g];
					if (game.challenger.id === args[1] && game.challenged.id === args[2]) {
						if (game.last === interaction.user.id) {
							interaction.reply({ content: "Du bist noch nicht wieder am Zug. Warte bitte, bis dein Gegner seinen Zug beendet hat.", ephemeral: true });
						}
						else {
							const x = Number.parseInt(args[3]);
							const y = Number.parseInt(args[4]);
							const buttons = interaction.message.components;
							const buttonLine = buttons[x];
							const embeds = interaction.message.embeds;
							if (interaction.user.id === game.challenger.id) {
								game.challenger.choices.push({ x, y });

								if (buttonLine.components) {
									buttonLine.components[y].emoji = { name: "⭕" };
									buttonLine.components[y].disabled = true;
								}
								if (embeds[0].fields)
									embeds[0].fields[0].value = `<@${args[2]}>`;
							}
							else {
								game.challenged.choices.push({ x, y });

								if (buttonLine.components) {
									buttonLine.components[y].emoji = { name: "❌" };
									buttonLine.components[y].disabled = true;
								}
								if (embeds[0].fields)
									embeds[0].fields[0].value = `<@${args[1]}>`;
							}
							game.last = interaction.user.id;
							const winner = this.checkTTTWinner(game);
							if (winner === undefined) {
								if (embeds[0].fields) {
									embeds[0].fields[0].name = "__Spiel vorbei!__";
									embeds[0].fields[0].value = "Das ergebnis des Spiels ist: *unentschieden*!\nFordert euch erneut heraus.";
								}
							}
							else if (typeof winner === "string") {
								if (embeds[0].fields) {
									embeds[0].fields[0].name = "__Spiel vorbei!__";
									embeds[0].fields[0].value = `Gewonnen hat <@${winner}>! Herzlichen Glückwunsch!`;
									for (const row of buttons) {
										if (row.components) {
											for (const button of row.components) {
												button.disabled = true;
											}
										}
									}
								}
							}

							clearTimeout(game.id);
							if (winner !== null) {
								const arr = [];
								for (const a in games.ttt) {
									if (a !== g) arr.push(games.ttt[a]);
								}
								games.ttt = arr;
							}
							else {
								game.id = setTimeout(() => {
									for (const row of buttons) {
										if (row.components) {
											for (const button of row.components) {
												button.disabled = true;
											}
										}
									}
									if (embeds[0].fields) {
										embeds[0].fields[0].name = "__Spiel vorbei!__";
										embeds[0].fields[0].value = "Die zeit ist abgelaufen!";
									}
									interaction.message.edit({ content: `Das Spiel zwischen <@${args[1]}> und <@${args[2]}> ist leider abgelaufen.\nFordert euch erneut heraus!`, embeds, components: buttons });
									const games = JSON.parse(Deno.readTextFileSync("var/db/minispiele.json"));
									const arr = [];
									for (const game of games.ttt) {
										if (!(game.challenger.id === args[1] && game.challenged.id === args[2])) arr.push(game);
									}
									games.ttt = arr;
									Deno.writeTextFileSync("var/db/minispiele.json", JSON.stringify(games));
								}, 300000);
							}
							Deno.writeTextFileSync("var/db/minispiele.json", JSON.stringify(games));
							interaction.respond({ type: "UPDATE_MESSAGE", content: interaction.message.content, embeds: embeds, components: buttons });
						}
					}
				}
			}
		}
	}

	@event()
	private error (error: Error): void {
		log.getLogger("Discord").error(error);
	}

	@event("gatewayError")
	private onGatewayError (error: ErrorEvent, nums: any): void {
		log.getLogger("Discord").error(error.error);
		log.getLogger("Discord").error(nums);
	}

	@slash("strike")
	private async onStrike (interaction: ApplicationCommandInteraction): Promise<void> {
		if (this.isMod(await interaction.resolved.members[interaction.options[0].value].roles.array() || interaction.resolved.members[interaction.options[0].value].user.bot)) {
			interaction.reply({ content: `Ein <@&${ConfigManager.get().discord.modRole}> oder Bot kann keinen Strike bekommen!`, ephemeral: true });
			return;
		}
		const strikes = JSON.parse(Deno.readTextFileSync("var/db/strikes.json"));
		if (!strikes[interaction.options[0].value]) strikes[interaction.options[0].value] = [];
		if (interaction.options.length === 1)
			strikes[interaction.options[0].value].push({ time: Date.now() });
		else
			strikes[interaction.options[0].value].push({ time: Date.now(), reason: interaction.options[1].value });
		Deno.writeTextFileSync("var/db/strikes.json", JSON.stringify(strikes));
		const strikeCount = strikes[interaction.options[0].value].length;
		const member = interaction.resolved.members[interaction.options[0].value];

		if (strikeCount === 3) {
			interaction.reply({ content: `${interaction.option("member")} hat nun ${strikeCount} Strikes und wurde **gekickt**!`, ephemeral: true });
			try {
				await member.user.send(`Du hast auf dem Server *${interaction.guild?.name}* jetzt **${strikeCount} Strikes** gesammelt. Zur Strafe wirst du deshalb jetzt vom Server gekickt.\nKomm wieder, wenn du dich besser benehmen kannst.`);
			}
			finally {
				member.kick(`${strikeCount} Strikes gesammelt!\n${interaction.options[1] || ""}`.trim());
				log.getLogger("Discord").warning(`Member ${member.user.tag} (${member.user.id}) bekam den ${strikeCount}. Strike und wurde gekickt!`);
			}
		}
		else if (strikeCount === 5) {
			interaction.reply({ content: `${interaction.option("member")} hat nun ${strikeCount} Strikes und wurde ***gebannt***!`, ephemeral: true });
			try {
				await member.user.send(`Du hast auf dem Server *${interaction.guild?.name}* jetzt **${strikeCount} Strikes** gesammelt. Deshalb wirst du jetzt endgültig vom Server ***gebannt***!`);
			}
			finally {
				member.ban(`Trotz Kick insgesamt ${strikeCount} Strikes gesammelt!\n${interaction.options[1] || ""}`.trim());
				log.getLogger("Discord").warning(`Member ${member.user.tag} (${member.user.id}) bekam den ${strikeCount}. Strike und wurde gebannt!`);
			}
		}
		else {
			interaction.reply({ content: `${interaction.option("member")} hat nun ${strikeCount} Strikes!`, ephemeral: true });
			try {
				await member.user.send(`Du hast auf dem Server *${interaction.guild?.name}* jetzt **${strikeCount} Strikes** gesammelt.\nPass in Zukunft besser auf die *Regeln* und dein *Verhalten* auf, damit du keine weiteren Strikes bekommst!`);
			}
			finally {
				log.getLogger("Discord").warning(`Member ${member.user.tag} (${member.user.id}) bekam den ${strikeCount}. Strike!`);
			}
		}
	}

	@slash("strikes")
	private async onStrikes (interaction: ApplicationCommandInteraction): Promise<void> {
		if (interaction.options.length > 0 && !this.isMod(await interaction.member?.roles.array())) {
			interaction.reply({ content: `Nur ein <@&${ConfigManager.get().discord.modRole}> kann die Strikes anderer Mitglieder einsehen.`, ephemeral: true });
		}
		else {
			const strikes = JSON.parse(Deno.readTextFileSync("var/db/strikes.json"));
			if (interaction.options.length === 0) {
				const embed: DiscordEmbed = new DiscordEmbed({ color: Colors.Green });
				embed.setTitle("Deine Strikes");
				embed.setDescription(`Du hast momentan **${strikes[interaction.member?.id || "0"]?.length || 0}** Strikes!`);
				if (strikes[interaction.member?.id || "0"]?.length >= 3) embed.setColor(Colors.Red);
				else if (strikes[interaction.member?.id || "0"]?.length >= 0) embed.setColor(Colors.Yellow);

				for (const strike of strikes[interaction.member?.id || "0"] || []) {
					embed.addField(LogFormatter.formatDate(new Date(strike.time)), strike.reason || "\u200b", false);
				}
				interaction.reply({ embeds: [embed.toJSON()], ephemeral: true });
			}
			else {
				interaction.reply({ content: `${interaction.resolved.members[interaction.options[0].value]} hat momentan **${strikes[interaction.options[0].value].length}** Strikes!`, ephemeral: true });
			}
		}
	}

	@subslash("geburtstag", "eintrag")
	private onBirthdayAdd (interaction: ApplicationCommandInteraction): void {
		const birthdays = JSON.parse(Deno.readTextFileSync("var/db/geburtstage.json"));

		const day = interaction.option("tag") || 0;
		const month = interaction.option("monat") || 0;
		let year = Number(interaction.option("jahr"));

		if (month <= 0 || month > 12 || day <= 0) {
			interaction.reply({ content: "Dieses Datum ist ungültig. Überprüfe bitte deine Eingabe!", ephemeral: true });
			return;
		}
		else if (month === 2 && day > 29) {
			interaction.reply({ content: "Dieses Datum ist ungültig. Überprüfe bitte deine Eingabe!", ephemeral: true });
			return;
		}
		else if ((month === 4 || month === 6 || month === 9 || month === 11) && day > 30) {
			interaction.reply({ content: "Dieses Datum ist ungültig. Überprüfe bitte deine Eingabe!", ephemeral: true });
			return;
		}
		else if ((month === 1 || month === 3 || month === 5 || month === 7 || month === 8 || month === 10 || month === 12) && day > 31) {
			interaction.reply({ content: "Dieses Datum ist ungültig. Überprüfe bitte deine Eingabe!", ephemeral: true });
			return;
		}

		if (year && year <= new Date().getFullYear() - 2000) year += 2000;
		else if (year && year < 100) year += 1900;

		if (year && (year < 1900 || year > new Date().getFullYear())) {
			interaction.reply({ content: "Dieses Datum ist ungültig. Überprüfe bitte deine Eingabe!", ephemeral: true });
			return;
		}

		const birthday = { day, month, year };
		birthdays[interaction.user.id] = birthday;
		Deno.writeTextFileSync("var/db/geburtstage.json", JSON.stringify(birthdays, null, 2));
		log.getLogger("Discord").info(`Birthday of ${interaction.user.id} was set`);
		if (year)
			interaction.reply({ content: `Du hast am ${day.toString().padStart(2, "0")}.${month.toString().padStart(2, "0")}.${year.toString().padStart(4, "0")} Geburtstag und bist ${this.calcAge(new Date(year, month as number, day as number))} Jahre alt! 🥳`, ephemeral: true });
		else
			interaction.reply({ content: `Du hast am ${day.toString().padStart(2, "0")}.${month.toString().padStart(2, "0")}. Geburtstag! 🥳`, ephemeral: true });
	}

	@subslash("geburtstag", "entfernen")
	private async onBirthdayRemove (interaction: ApplicationCommandInteraction): Promise<void> {
		if (interaction.options.length > 0 && !this.isMod(await interaction.member?.roles.array())) {
			interaction.reply({ content: `Nur ein <@&${ConfigManager.get().discord.modRole}> kann den Geburtstag anderer Mitglieder löschen.`, ephemeral: true });
		}
		else {
			const member = interaction.options[0]?.value || interaction.user.id;
			const birthdays = JSON.parse(Deno.readTextFileSync("var/db/geburtstage.json"));
			if (birthdays[member]) delete birthdays[member];
			Deno.writeTextFileSync("var/db/geburtstage.json", JSON.stringify(birthdays, null, 2));
			log.getLogger("Discord").info(`Birthday of ${interaction.user.id} was removed`);
			interaction.reply({ content: "Dein Geburtstag wurde aus der Datenbank gelöscht!", ephemeral: true });
		}
	}

	@subslash("geburtstag", "wann")
	private onBirthdayWhen (interaction: ApplicationCommandInteraction): void {
		const member = interaction.options[0]?.value || interaction.user.id;
		const birthday = JSON.parse(Deno.readTextFileSync("var/db/geburtstage.json"))[member];
		if (birthday) {
			if (birthday.year) {
				interaction.reply({ content: `Der Geburtstag von <@${member}> ist am ${birthday.day.toString().padStart(2, "0")}.${birthday.month.toString().padStart(2, "0")}.${birthday.year.toString().padStart(4, "0")}! 🥳\nDas Mitglied ist ${this.calcAge(new Date(birthday.year, birthday.month, birthday.day))} Jahre alt.` });
			}
			else {
				interaction.reply({ content: `Der Geburtstag von <@${member}> ist am ${birthday.day.toString().padStart(2, "0")}.${birthday.month.toString().padStart(2, "0")}.! 🥳` });
			}
		}
		else {
			interaction.reply({ content: "Zu diesem Mitglied ist uns der Geburtstag nicht bekannt.", ephemeral: true });
		}
	}

	@subslash("minigame", "schnickschnackschnuck")
	private async onSchnickSchnackSchnuck (interaction: ApplicationCommandInteraction): Promise<void> {
		await MiniGames.onSchnickSchnackSchnuck(interaction);
	}

	@subslash("minigame", "tictactoe")
	private async onTicTacToe (interaction: ApplicationCommandInteraction): Promise<void> {
		await MiniGames.onTicTacToe(interaction);
	}

	@slash("version")
	private async onVersion (interaction: ApplicationCommandInteraction): Promise<void> {
		const defer = await interaction.defer(false);

		const embed = new DiscordEmbed();
		embed.setTitle(`__Version: ${this.VERSION}__`);
		embed.setThumbnail({ url: `https://cdn.discordapp.com/avatars/${this.user?.id}/${this.user?.avatar}.png` });
		const repo = (await (await fetch(`https://github.com/MaddieJuno/RoboJuno/releases/tag/${this.VERSION.split(".").slice(0, -1).join(".")}`)).text()).split("/MaddieJuno/RoboJuno/commit/")[1].split("\"")[0];
		const commit = (await (await fetch(`https://github.com/MaddieJuno/RoboJuno/commit/${repo}`)).text());
		embed.setImage({ url: commit.split("og:image")[1].split("\"")[2] });

		//let changelog = (await fetch("https://raw.githubusercontent.com/MaddieJuno/RoboJuno/main/CHANGELOG.md")).text().split("#")[8];
		const changelog = Deno.readTextFileSync("var/changelog.txt").trim();
		embed.setDescription((await (await fetch("https://raw.githubusercontent.com/MaddieJuno/RoboJuno/main/README.md")).text()).split("# Robo Juno")[1].split("#")[0].trim());
		embed.addField("__Changelog__", changelog, false);
		embed.addField("__Author__", "Ich werde entwickelt von:\n<@298215920709664768> (Develeon#1010)\nGitHub: [Develeon64](https://github.com/Develeon64)", true);
		embed.addField("__Code__", "Mein Code ist auf GitHub unter\n[MaddieJuno/RoboJuno](https://github.com/MaddieJuno/RoboJuno)", true);

		//interaction.reply({ embeds: [embed.toJSON()] });
		defer.editResponse({ embeds: [embed.toJSON()] });
	}

	private calcAge (date: Date): number {
		const today = new Date();
		let age = today.getFullYear() - date.getFullYear();
		const m = today.getMonth() - date.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
		return age;
	}

	private checkTTTWinner (game: { id: number, challenger: { id: string, choices: { x: number, y: number }[] }, challenged: { id: string, choices: { x: number, y: number }[] }, last: string }): string | undefined | null {
		const challengerRows: number[] = [0, 0, 0];
		const challengerCols: number[] = [0, 0, 0];
		const challengerDiag: number[] = [0, 0];
		for (const row of game.challenger.choices) {
			challengerRows[row.x]++;
			challengerCols[row.y]++;
			if (row.x === row.y) challengerDiag[0]++;
			if (Math.abs(row.x - row.y) === 2 || (row.x === 1 && row.y === 1)) challengerDiag[1]++;
		}

		const challengedRows: number[] = [0, 0, 0];
		const challengedCols: number[] = [0, 0, 0];
		const challengedDiag: number[] = [0, 0];
		for (const row of game.challenged.choices) {
			challengedRows[row.x]++;
			challengedCols[row.y]++;
			if (row.x === row.y) challengedDiag[0]++;
			if (Math.abs(row.x - row.y) === 2 || (row.x === 1 && row.y === 1)) challengedDiag[1]++;
		}

		if (challengerRows.includes(3) || challengerCols.includes(3) || challengerDiag.includes(3)) return game.challenger.id;
		else if (challengedRows.includes(3) || challengedCols.includes(3) || challengedDiag.includes(3)) return game.challenged.id;
		else if (game.challenger.choices.length + game.challenged.choices.length === 9) return undefined;
		else return null;
	}

	private async updateMemberCount(): Promise<void> {
		let userCount = 0;
		const countedMembers: string[] = [];
		const members = await DiscordBot.guild?.members.array() || [];
		for (let member of members) {
			member = await DiscordBot.guild?.members.fetch(member.id) as Member;
			if (!member.user.bot && !this.nonCountedMembers.includes(member.id) && !(countedMembers.includes(member.user.username.toLowerCase()) || (member.nick && countedMembers.includes(member.nick.toLowerCase())))) {
				countedMembers.push(member.user.username.toLowerCase());
				if (member.nick) countedMembers.push(member.nick.toLowerCase());
				userCount++;
			}
		}

		(await DiscordBot.guild?.channels.get(ConfigManager.get().discord.countChannel.id))?.setName(`Mitglieder: ${userCount}`);
		log.getLogger("Discord").debug(`Member-Count updated: ${userCount} members`);
	}

	private async getLeaveType (member: Member): Promise<AuditLogEntry | null> {
		const kickLog = await DiscordBot.guild?.fetchAuditLog({ limit: 1, actionType: AuditLogEvents.MemberKick });
		const banLog = await DiscordBot.guild?.fetchAuditLog({ limit: 1, actionType: AuditLogEvents.MemberBanAdd });
		let auditLog;

		if (kickLog && banLog) auditLog = this.calcDateFromId(kickLog?.entries[0].id || "0") > this.calcDateFromId(banLog?.entries[0].id || "0") ? kickLog : banLog;
		else if (kickLog && !banLog) auditLog = kickLog;
		else if (!kickLog && banLog) auditLog = banLog;
		else return null;

		if (this.calcDateFromId(auditLog.entries[0].id) < new Date(member.joinedAt) || (auditLog.entries[0] as any).targetID !== member.id) return null;
		else return auditLog.entries[0];
	}

	private calcDateFromId (id: string): Date {
		return new Date(Number(BigInt.asUintN(64, BigInt(id)) >> 22n) + 1420070400000);
	}

	private calcDates (current: number): { milliseconds: number, seconds: number, minutes: number, hours: number, days: number, weeks: number, months: number, years: number, decades: number, centuries: number, millenia: number } {
		const milliseconds = Date.now() - current;
		const seconds = Math.floor(milliseconds / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);
		const weeks = Math.floor(days / 7);
		const months = Math.floor(days / 30);
		const years = Math.floor(days / 365);
		const decades = Math.floor(years / 10);
		const centuries = Math.floor(years / 100);
		const millenia = Math.floor(years / 1000);
		return { milliseconds, seconds, minutes, hours, days, weeks, months, years, decades, centuries, millenia };
	}

	private isMod (roles?: Role[]): boolean {
		if (!roles) return false;
		for (const role of roles) {
			if (ConfigManager.get().discord.adminRoles.includes(role.id)) {
				return true;
			}
		}
		return false;
	}
}
