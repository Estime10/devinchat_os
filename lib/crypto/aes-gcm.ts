import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function decodeKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== 32) {
    throw new Error(
      "GITHUB_CREDENTIALS_ENCRYPTION_KEY must decode to 32 bytes (base64)",
    );
  }
  return key;
}

export type EncryptedPayload = {
  ciphertext: string;
  nonce: string;
};

/**
 * AES-256-GCM — ciphertext = iv||tag||data en base64 (nonce séparé aussi stocké).
 */
export function encryptAesGcm(
  plaintext: string,
  base64Key: string,
): EncryptedPayload {
  const key = decodeKey(base64Key);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const packed = Buffer.concat([encrypted, tag]);

  return {
    ciphertext: packed.toString("base64"),
    nonce: iv.toString("base64"),
  };
}

export function decryptAesGcm(
  payload: EncryptedPayload,
  base64Key: string,
): string {
  const key = decodeKey(base64Key);
  const iv = Buffer.from(payload.nonce, "base64");
  const packed = Buffer.from(payload.ciphertext, "base64");
  const tag = packed.subarray(packed.length - 16);
  const encrypted = packed.subarray(0, packed.length - 16);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}
