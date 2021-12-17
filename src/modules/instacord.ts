import {
	log,
	Message,
	TextChannel,
} from "../../deps.ts";
import { ConfigManager } from "../managers/configmanager.ts";
import {
	Colors,
	DiscordEmbed,
} from "../managers/discordembedmanager.ts";

export class InstacordChecker {
	private static fileEndings: string[] = [
		".jpg",
		".jpeg",
		".png",
		".gif",
		".gifv",
		".webm"
	]

	public static checkMessage (message: Message): boolean {
		let onlyImages: boolean = message.attachments.length > 0;
		for (const att of message.attachments) {
			if (!InstacordChecker.fileEndings.includes(`.${att.filename.split(".").pop()}`.toLowerCase())) {
				onlyImages = false;
				break;
			}
		}

		onlyImages = onlyImages || message.content.includes("instagram.com/p/");

		return message.channelID === ConfigManager.get().discord.instacordChannel && !onlyImages;
	}

	public static async actMessage (message: Message): Promise<void> {
		const reply: Message = await message.reply(`${message.member} bitte keine reinen Texte in diesem Channel.\nDies ist ein Channel nur für Kunst in Form von Bildern. Du kannst im Thread unterhalb des jeweiligen Bildes etwas dazu sagen.\nWenn du über etwas Kreatives reden möchtest, kannst du das gerne in <#${ConfigManager.get().discord.creativeChannel}> tun.`);
		message.delete();
		setTimeout((): void => {
			reply.delete();
		}, 30000);

		let pnSuccessfull = false;
		try {
			if (message.content.length > 0) {
				const embed = new DiscordEmbed({ color: Colors.DarkGrey });
				embed.setTitle("Damit du deinen Text vom #instacord nicht komplett neu schreiben musst, ist hier eine Kopie deiner Nachricht:");
				embed.setDescription(`\`\`\`${message.content}\`\`\``);
				await message.author.send({ embeds: [embed.toJSON()] });
				pnSuccessfull = true;
			}
		}
		catch {
			pnSuccessfull = false;
		}
		finally {
			if (message.content.length > 0) {
				const embed = new DiscordEmbed({ color: Colors.DarkGrey });
				embed.setTitle(`Text von ${message.member?.nick || message.member?.user.username} im #instacord!`);
				embed.setDescription(`\`\`\`${message.content}\`\`\``);
				embed.addField("__Member__", message.author.mention, false);
				embed.addField("__PN geschickt__", pnSuccessfull ? "✅ ja" : "❌ nein", false);
				(await message.guild?.channels.get(ConfigManager.get().discord.modLogChannel) as TextChannel).send({ embeds: [embed.toJSON()] });
			}
		}

		log.getLogger("Discord").warning(`Member ${message.author.username}#${message.author.discriminator} (${message.author.id}) posted wrong content into #instacord!`);
	}
}
