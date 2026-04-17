import Redis from "ioredis";

export const redis = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
);

// This function creates a cache key by combining the image ID with a base64-encoded string of the transformations.
export function getTransformKey(imageId: string, transformations: any) {
  return `image:${imageId}:transform:${Buffer.from(JSON.stringify(transformations)).toString("base64")}`;
}
