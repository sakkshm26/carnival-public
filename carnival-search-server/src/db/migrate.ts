import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { config } from "../providers/config";
import { getDbUri } from ".";

const db = drizzle(getDbUri({
    username: config.db_username,
    password: config.db_password,
    host: config.db_host,
    port: config.db_port,
    database: config.db_name
}))

export const main = async () => {
    try {
        await migrate(db, {
            migrationsFolder: config.node_env === "dev" ? "./src/db/migrations/dev" : "./src/db/migrations/prod",
        });
        console.log("Migrations complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migrations failed!", err);
        process.exit(1);
    }
};

main();
