import {
	Channel,
	Guild,
	User,
} from "../../../../deps.ts";
import type {
	ChannelPayload,
	GuildPayload,
	UserPayload,
} from "../../../../deps.ts";

export type AllowedMentions = {
	parse?: ["roles", "users", "everyone"],
	roles?: string[],
	users?: string[]
};

export type DiscordWebhook = {
	content?: string,
	username?: string,
	avatar_url?: string,
	tts?: boolean,
	file?: string,
	embeds?: DiscordEmbed[],
	payload_json?: string,
	allowed_mentions?: AllowedMentions
};

export type DiscordInvite = {
	code: string,
	guild?: DiscordGuild,
	channel: DiscordChannel,
	inviter?: DiscordUser,
	uses?: number,
	max_uses?: number,
	max_age?: number,
	temporary?: boolean,
	created_at?: string
};

export type PossibleDiscordInvite = {
	code: string,
	guild?: Guild | GuildPayload,
	channel?: ChannelPayload,
	inviter?: User | UserPayload,
	target?: {
		user?: UserPayload,
		type?: number
	},
	uses?: number,
	maxUses?: number | null,
	maxAge?: number | null,
	temporary?: boolean,
	createdAt: Date,
	type: "+" | "−" | "✕"
}

type DiscordGuild = {
	id: string,
	name: string,
	splash: string | null,
	banner: string | null,
	description: string | null,
	icon: string | null,
	// deno-lint-ignore no-explicit-any
	features: any[],
	verification_level?: number,
	vanity_url_code?: string | number
};

type DiscordChannel = {
	id: string,
	name?: string,
	type: number
};

type DiscordUser = {
	id: string,
	username: string,
	avatar: string,
	discriminator: string,
	public_flags?: number
};

export type DiscordEmbed = {
	title?: string,
	type?: "rich" | "image" | "video" | "gifv" | "article" | "link",
	description?: string,
	url?: string,
	timestamp?: string,
	color?: number,
	footer?: DiscordFooter,
	image?: DiscordImage,
	thumbnail?: DiscordThumbnail,
	video?: DiscordVideo,
	provider?: DiscordProvider,
	author?: DiscordAuthor,
	fields?: DiscordField[]
};

export type DiscordFooter = {
	text: string,
	icon_url?: string,
	proxy_icon_url?: string
};

export type DiscordImage = {
	url?: string,
	proxy_url?: string,
	height?: number,
	width?: number
};

export type DiscordThumbnail = {
	url?: string,
	proxy_url?: string,
	height?: number,
	width?: number
};

export type DiscordVideo = {
	url?: string,
	height?: number,
	width?: number
};

export type DiscordProvider = {
	name?: string,
	url?: string
};

export type DiscordAuthor = {
	name?: string,
	url?: string,
	icon_url?: string,
	proxy_icon_url?: string
};

export type DiscordField = {
	name: string,
	value: string,
	inline?: boolean
};
