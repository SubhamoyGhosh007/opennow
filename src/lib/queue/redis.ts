import IORedis from "ioredis";

let redis: IORedis | null = null;

export function getRedisConnection() {
  if (!redis) {
    redis = new IORedis({
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT || 6379),
      maxRetriesPerRequest: null,
    });
  }
  return redis;
}

export function getBullConnection() {
  return {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT || 6379),
    maxRetriesPerRequest: null,
  };
}

