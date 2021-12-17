import {
	log,
} from "../../deps.ts";
import {
	CacheManager,
} from "./cachemanager.ts";
import type {
	AppConfig,
} from "../interfaces/types/appconfig.ts";

export class ConfigManager {
	private static readonly CONFIGPATH: string = "var/conf/";
	private static readonly CONFIGNAME: string = "config.json";
	private static readonly CONFIGKEY: string = "config";

	public static get (): AppConfig {
		let cache: AppConfig | undefined = CacheManager.get(ConfigManager.CONFIGKEY);
		if (!cache) {
			cache = ConfigManager.read();
			CacheManager.set(ConfigManager.CONFIGKEY, cache, 30000);
			log.getLogger("System").debug("Config was refreshed!");
		}
		return cache;
	}

	private static read (): AppConfig {
		const config: AppConfig = ConfigManager.checkFile();
		return {
			discord: {
				token: config?.discord?.token || "",
				guild: config?.discord?.guild || "",
				memberAdd: config?.discord?.memberAdd || { id: "", token: "" },
				welcomeChannel: config?.discord?.welcomeChannel || { id: "", token: "" },
				birthdayChannel: config?.discord?.birthdayChannel || { id: "", token: "" },
				instacordChannel: config?.discord?.instacordChannel || "",
				creativeChannel: config?.discord?.creativeChannel || "",
				countChannel: config?.discord?.countChannel || "",
				modLogChannel: config?.discord?.modLogChannel || "",
				adminRoles: config?.discord?.adminRoles || [],
				modRole: config?.discord?.modRole || "",
			},
			logging: {
				discord: {
					active: config?.logging?.discord?.active !== undefined ? config.logging.discord.active : false,
					logAction: config?.logging?.discord?.logAction || { id: "", token: "" }
				}
			}
		};
	}

	private static checkFile (): AppConfig {
		// check and create Dir

		const filePath: string = ConfigManager.CONFIGPATH + ConfigManager.CONFIGNAME;
		// check and create File

		let configText: string = Deno.readTextFileSync(filePath);
		if (configText.length <= 2) {
			configText = "{}";
			Deno.writeTextFileSync(filePath, configText);
		}

		return JSON.parse(configText);
	}
}
