export type AppConfig = {
	discord: {
		token: string,
		guild: string,
		//userRole: string,
		//drinkerRole: string,
		memberAdd: {
			id: string,
			token?: string
		},
		welcomeChannel: {
			id: string,
			token?: string
		},
		birthdayChannel: {
			id: string,
			token?: string
		},
		instacordChannel: string,
		creativeChannel: string,
		countChannel: {
			id: string
		},
		modLogChannel: string,
		adminRoles: string[],
		modRole: string
		//twitchLog: {
		//	id: string,
		//	token?: string,
		//	role: string
		//},
		//twitchChat: {
		//	id: string,
		//	token?: string
		//},
		//inviteCache: string
	},
	/*api: {
		port: number,
		links: {
			steam: {
				id: string
			},
			discord: {
				channel: string
			}
		},
		apis: {
			userstack: {
				key: string
			},
			hereapi: {
				key: string
			}
		},
		linkClick: {
			id: string,
			token?: string
		}
	},*/
	logging: {
		discord: {
			active: false,
			logAction: {
				id: string,
				token?: string
			}
		}
	}
};
