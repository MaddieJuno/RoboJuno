// tslint:disable-next-line: max-line-length
import { DiscordBot } from "../discord.ts";
import type {
	DiscordAuthor,
	DiscordEmbed as Embed,
	DiscordField,
	DiscordFooter,
	DiscordImage,
	DiscordProvider,
	DiscordThumbnail,
	DiscordVideo,
} from "../interfaces/types/discord.ts";
import { Embed as StandardEmbed } from "../../deps.ts";

export class DiscordEmbed {
	private readonly MAXCHARS: number = 6000;

	private title?: string;
	private type?: "rich" | "image" | "video" | "gifv" | "article" | "link";
	private description?: string;
	private url?: string;
	private timestamp?: string;
	private color?: number;
	private footer?: DiscordFooter;
	private image?: DiscordImage;
	private thumbnail?: DiscordThumbnail;
	private video?: DiscordVideo;
	private provider?: DiscordProvider;
	private author?: DiscordAuthor;
	private fields: DiscordField[];

	public constructor (embed?: Embed) {
		this.fields = [];

		this.setTitle(embed?.title);
		//this.type = embed?.type || "rich";
		this.setDescription(embed?.description);
		this.url = embed?.url || undefined;
		this.timestamp = embed?.timestamp || new Date().toISOString();
		this.color = embed?.color || Colors.Blue;
		this.setFooter(embed?.footer || { text: "Develeon64", icon_url: `https://cdn.discordapp.com/avatars/298215920709664768/8baae47e2e1bb0ab72b6a3881f7116d6.png` });
		this.image = embed?.image || undefined;
		this.thumbnail = embed?.thumbnail || undefined;
		this.video = embed?.video || undefined;
		//this.provider = embed?.provider || { name: "Develeon Software", url: "https://www.develeon.de/" };
		this.setAuthor(embed?.author || { name: DiscordBot.guild?.name, icon_url: `https://cdn.discordapp.com/icons/${DiscordBot.guild?.id}/${DiscordBot.guild?.icon}.png` });
		if (embed?.fields) this.setFields(embed?.fields);
	}

	public getCharCount (): number {
		let count: number = this.title?.length || 0;
		count += this.description?.length || 0;
		count += this.footer?.text.length || 0;
		count += this.author?.name?.length || 0;

		for (const field of this.fields) {
			count += field.name.length || 0;
			count += field.value.length || 0;
		}

		return count;
	}

	public getTitle (): string | undefined {
		return this.title;
	}

	public setTitle (value: string | undefined): DiscordEmbed {
		if (value) {
			const chars: number = this.getCharCount();
			value = value.substr(0, 256);
			this.title = (chars + value.length <= this.MAXCHARS) ? value : value.substr(0, this.MAXCHARS - chars);
		}
		else {
			this.title = undefined;
		}

		return this;
	}

	public getDescription (): string | undefined {
		return this.description;
	}

	public setDescription (value: string | undefined): DiscordEmbed {
		if (value) {
			const chars: number = this.getCharCount();
			value = value.substr(0, 2048);
			this.description = (chars + value.length <= this.MAXCHARS) ? value : value.substr(0, this.MAXCHARS - chars);
		}
		else {
			this.description = undefined;
		}
		return this;
	}

	public getUrl (): string | undefined {
		return this.url;
	}

	public setUrl (value: string | undefined): DiscordEmbed {
		this.url = value;
		return this;
	}

	public getTimestamp (): string | undefined {
		return this.timestamp;
	}

	public setTimestamp (value: string | undefined): DiscordEmbed {
		this.timestamp = value;
		return this;
	}

	public getColor (): number | undefined {
		return this.color;
	}

	public setColor (value: number | undefined): DiscordEmbed {
		this.color = value;
		return this;
	}

	public getFooter (): DiscordFooter | undefined {
		return this.footer;
	}

	public setFooter (value: DiscordFooter | undefined): DiscordEmbed {
		if (value) {
			const chars: number = this.getCharCount();
			value.text = value.text.substr(0, 2048);
			this.footer = { text: (chars + value.text.length <= this.MAXCHARS) ? value.text : value.text.substr(0, this.MAXCHARS - chars), icon_url: value.icon_url, proxy_icon_url: value.proxy_icon_url };
		}
		else {
			this.footer = undefined;
		}
		return this;
	}

	public getImage (): DiscordImage | undefined {
		return this.image;
	}

	public setImage (value: DiscordImage | undefined): DiscordEmbed {
		this.image = value;
		return this;
	}

	public getThumbnail (): DiscordThumbnail | undefined {
		return this.thumbnail;
	}

	public setThumbnail (value: DiscordThumbnail | undefined): DiscordEmbed {
		this.thumbnail = value;
		return this;
	}

	public getAuthor (): DiscordAuthor | undefined {
		return this.author;
	}

	public setAuthor (value: DiscordAuthor | undefined): DiscordEmbed {
		if (value) {
			if (value.name) {
				const chars: number = this.getCharCount();
				value.name = value.name.substr(0, 256);
				this.author = { name: (chars + value.name.length) ? value.name : value.name.substr(0, this.MAXCHARS - chars), url: value.url, icon_url: value.icon_url, proxy_icon_url: value.proxy_icon_url };
			}
			else {
				this.author = { name: undefined, url: value.url, icon_url: value.icon_url, proxy_icon_url: value.proxy_icon_url };
			}
		}
		else {
			this.author = undefined;
		}
		return this;
	}

	public getFields (): DiscordField[] {
		return this.fields;
	}

	public setFields (value: DiscordField[]): DiscordEmbed {
		this.fields = [];
		for (const val of value) this.addField(val.name, val.value, val.inline);
		return this;
	}

	public addField (name: string, value: string, inline?: boolean): DiscordEmbed {
		name = (name !== "") ? name : "\u200b";
		value = (value !== "") ? value : "\u200b";
		const chars: number = this.getCharCount();

		if (this.fields.length < 25 && chars <= this.MAXCHARS - 2) {
			name = name.substr(0, 256).substr(0, this.MAXCHARS - chars - 1);
			//value = value.substr(0, 1024).substr(0, this.MAXCHARS - chars - name.length);
			value = (name.length >= this.MAXCHARS - chars - 1 && value.length > 1) ? "\u200b" : value.substr(0, 1024).substr(0, this.MAXCHARS - chars - name.length);

			if (this.fields) this.fields.push({ name, value, inline });
			else this.fields = [{ name, value, inline }];
		}
		return this;
	}

	public addBlankField (inline?: boolean): DiscordEmbed {
		return this.addField("\u200b", "\u200b", inline);
	}

	public toJSON (): Embed {
		return {
			title: this.title,
			type: this.type,
			description: this.description,
			url: this.url,
			timestamp: this.timestamp,
			color: this.color,
			footer: this.footer,
			image: this.image,
			thumbnail: this.thumbnail,
			video: this.video,
			provider: this.provider,
			author: this.author,
			fields: this.fields
		};
	}

	public toEmbed (): StandardEmbed {
		return new StandardEmbed(this.toJSON());
	}

	public toString (): string {
		return JSON.stringify(this, null, 2);
	}
}

export enum Colors {
	DarkGrey = 4144959,
	Gray = 8355711,
	LightGrey = 12566463,
	Blue = 4161471,
	Yellow = 12549951,
	LightGreen = 4177791,
	Green = 8372031,
	Purple = 8339391,
	Red = 12533631
}
