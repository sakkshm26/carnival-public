import type { Config } from "drizzle-kit";
import { config } from "./src/providers/config";
import { getDbUri } from "./src/db";

export default {
    dialect: "postgresql",
	dbCredentials: {
		url: getDbUri({
			username: config.db_username,
			password: config.db_password,
			host: config.db_host,
			port: config.db_port,
			database: config.db_name
		})
	},
	schema: "./src/db/schema.ts",
	out: config.node_env === "dev" ? "./src/db/migrations/dev" : "./src/db/migrations/prod",
} satisfies Config;
