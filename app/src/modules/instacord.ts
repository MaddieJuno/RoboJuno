import {
	log,
	Message,
	TextChannel,
} from "../../../deps.ts";
import { ConfigManager } from "../managers/configmanager.ts";

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
		const reply: Message = await message.reply(`${message.member} bitte keine reinen Texte in diesem Channel.\nDies ist ein Channel nur für Kunst in Form von Bildern. Wenn du über etwas Kreatives reden möchtest, kannst du das gerne in <#${ConfigManager.get().discord.creativeChannel}> tun.\nFür einen Kommentar zu einem Post kannst du den jeweiligen Thread unterhalb benutzen.`);
		message.delete();
		setTimeout((): void => {
			reply.delete();
		}, 30000);

		try {
			if (message.content.length > 0) {
				await message.author.send({ embeds: [ { title: "Damit du deinen Text vom #instacord nicht komplett neu schreiben musst, ist hier eine Kopie deiner Nachricht:", description: `\`\`\`${message.content}\`\`\`` } ] });
			}
		}
		finally {
			if (message.content.length > 0) {
				(await message.guild?.channels.get(ConfigManager.get().discord.modLogChannel) as TextChannel).send({ embeds: [ { title: "Text im #instacord!", description: `\`\`\`${message.content}\`\`\`` } ] });
			}
		}

		log.getLogger("Discord").warning(`Member ${message.author.username}#${message.author.discriminator} (${message.author.id}) posted wrong content into #instacord!`);
	}
}
