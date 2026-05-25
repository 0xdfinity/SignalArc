import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "crypto";

const ALGORITHM = "aes-256-gcm";
const DEV_SECRET = "signal-arc-development-secret-key";

function getKey() {
  const source = process.env.SIGNALARC_SECRET_KEY;

  if (!source && process.env.NODE_ENV === "production") {
    throw new Error("SIGNALARC_SECRET_KEY is required in production.");
  }

  const keySource = source ?? DEV_SECRET;
  return createHash("sha256").update(keySource).digest();
}

export function isUsingDevelopmentSecret() {
  return !process.env.SIGNALARC_SECRET_KEY;
}

export function encryptSecret(value: string, context?: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);

  if (context) {
    cipher.setAAD(Buffer.from(context, "utf8"));
  }

  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return ["v1", iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSecret(payload: string, context?: string) {
  const parts = payload.split(".");
  const isVersioned = parts[0] === "v1";
  const [, versionedIv, versionedTag, versionedEncrypted] = parts;
  const [legacyIv, legacyTag, legacyEncrypted] = parts;
  const ivText = isVersioned ? versionedIv : legacyIv;
  const tagText = isVersioned ? versionedTag : legacyTag;
  const encryptedText = isVersioned ? versionedEncrypted : legacyEncrypted;

  if (!ivText || !tagText || !encryptedText) {
    throw new Error("Invalid encrypted secret format.");
  }

  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivText, "base64url"));

  if (isVersioned && context) {
    decipher.setAAD(Buffer.from(context, "utf8"));
  }

  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function hashSecret(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export function safeCompareHash(value: string, expectedHash: string) {
  const actual = hashSecret(value);
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expectedHash);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}
