import Redis from "ioredis";
import { config } from "./config";

const redis = new Redis({
    host: config.redis_host,
    port: config.redis_port,
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

redis.on("connect", () => {
    console.log("Connected to Redis");
});

redis.on("error", (error) => {
    console.log("Redis error", error);
});

export async function redisSet(key: string, value: string) {
    redis.set(key, value);
}

export async function redisSetEx(key: string, value: string, time: number) {
    redis.set(key, value, "EX", time);
}

export async function redisGet(key: string) {
    return redis.get(key);
}

export default redis;
