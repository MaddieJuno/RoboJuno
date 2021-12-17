// deno-lint-ignore-file no-explicit-any
import type {
	CacheDataSet,
} from "../interfaces/types/chachedata.ts";

export class CacheManager {
	private static cachedData: { [property: string]: CacheDataSet } = {};

	public static set (property: string, data: any, expireSeconds?: number): any {
		property = property.trim().toLowerCase();
		if (property.length > 0) {
			CacheManager.cachedData[property] = {
				createdAt: Date.now(),
				expiresAt: (expireSeconds && expireSeconds > 0) ? (Date.now() + (expireSeconds * 1000)) : undefined,
				data: data
			};
			return data;
		}
	}

	public static get (property: string): any {
		property = property.trim().toLowerCase();
		if (CacheManager.isValid(property)) return CacheManager.cachedData[property].data;
		else return undefined;
	}

	private static isValid (property: string): boolean {
		return CacheManager.cachedData[property] && !CacheManager.isExpired(property);
	}

	private static isExpired (property: string): boolean {
		if (CacheManager.cachedData[property]) {
			const expires: number | undefined = CacheManager.cachedData[property].expiresAt;
			if (expires) return expires < Date.now();
			else return false;
		}
		else return true;
	}
}
