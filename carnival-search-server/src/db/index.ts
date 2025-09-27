import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { config } from "../providers/config";

export const getDbUri = (DTO: { username: string, password?: string, host: string, port: number, database?: string }) => {
    const { username, password, host, port, database } = DTO;
    return `postgresql://${username}:${password || ""}@${host}:${port}/${database || ""}` + (host === "localhost" || host === "postgres" ? "" : "?sslmode=no-verify");
}

export const DB = drizzle(getDbUri({
    username: config.db_username,
    password: config.db_password,
    host: config.db_host,
    port: config.db_port,
    database: config.db_name
}), { schema });