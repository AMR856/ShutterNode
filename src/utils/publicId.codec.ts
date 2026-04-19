export function encodePublicId(publicId: string): string {
  return Buffer.from(publicId, "utf8").toString("base64");
}

export function decodePublicId(publicId: string): string {
  return Buffer.from(publicId, "base64").toString("utf8");
}
