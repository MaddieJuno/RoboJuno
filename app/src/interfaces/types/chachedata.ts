export type CacheDataSet = {
	createdAt: number,
	expiresAt: number | undefined,
	// deno-lint-ignore no-explicit-any
	data: any
};
