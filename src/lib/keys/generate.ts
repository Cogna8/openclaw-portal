import crypto from "node:crypto";
import { sha256 } from "@/lib/keys/hash";

export type GeneratedApiKey = {
  rawKey: string;
  lookupHash: string;
  secretHash: string;
  secretPrefix: string;
  lastFour: string;
};

export function generateApiKeyMaterial(): GeneratedApiKey {
  const secretPrefix = "cg8_sk_";
  const random = crypto.randomBytes(32).toString("base64url");
  const rawKey = `${secretPrefix}${random}`;
  const digest = sha256(rawKey);

  return {
    rawKey,
    lookupHash: digest,
    secretHash: digest,
    secretPrefix,
    lastFour: rawKey.slice(-4),
  };
}
