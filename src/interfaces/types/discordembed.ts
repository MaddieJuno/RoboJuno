import { Embed as DiscordEmbed } from "../../../deps.ts";
import { DiscordEmbed as EmbedPayload } from "./discord.ts";

export class Embed extends DiscordEmbed {
	constructor(data?: EmbedPayload) {
		super(data);
		this.setColor(0x3F7FBF);
		this.setFooter({ text: "Develeon64", icon_url: `https://cdn.discordapp.com/avatars/298215920709664768/8baae47e2e1bb0ab72b6a3881f7116d6.png` });
		this.setTimestamp(new Date().toISOString());
	}

	public addBlankField(inline?: boolean): Embed {
		this.addField("\u200b", "\u200b", inline);
		return this;
	}
}
