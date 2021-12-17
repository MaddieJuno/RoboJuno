import { RoboJuno } from "./bot.ts";

Deno.mkdirSync("logs", { recursive: true });
Deno.mkdirSync("var", { recursive: true });
Deno.mkdirSync("var/conf", { recursive: true });
Deno.mkdirSync("var/db", { recursive: true });
try {
	Deno.statSync("var/conf/config.json");
}
catch (error) {
	if (error && error.kind === Deno.errors.NotFound)
		Deno.writeTextFileSync("var/conf/config.json", "{}", { create: true });
	else
		throw error;
}

const _bot: RoboJuno = new RoboJuno();
