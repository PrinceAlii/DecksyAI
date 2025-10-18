import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import { join, relative } from "node:path";

import { getServerEnv } from "@/lib/env";

export interface AccountExportFile {
  /** Absolute path to the written file. */
  absolutePath: string;
  /** Project-relative storage path for persistence. */
  storagePath: string;
  /** Total bytes written. */
  bytes: number;
  /** SHA-256 checksum of the payload. */
  checksum: string;
}

const DEFAULT_EXPORT_DIR = join(process.cwd(), ".storage", "exports");
const ACCOUNT_EXPORT_ALGORITHM = "aes-256-gcm";
const ACCOUNT_EXPORT_IV_BYTES = 12;
const ACCOUNT_EXPORT_KEY_BYTES = 32;

let cachedDevelopmentKey: Buffer | null = null;
let devKeyNoticeLogged = false;

async function ensureDirectory(path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true });
}

export async function writeAccountExport(
  userId: string,
  payload: unknown,
): Promise<AccountExportFile> {
  const env = getServerEnv();
  const baseDir = env.ACCOUNT_EXPORT_DIR?.trim() || DEFAULT_EXPORT_DIR;

  await ensureDirectory(baseDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `${userId}-${timestamp}.json`;
  const absolutePath = join(baseDir, fileName);

  const serialised = JSON.stringify(payload, null, 2);
  const plaintextBuffer = Buffer.from(serialised, "utf8");
  const { key, keyId } = resolveEncryptionMaterial(env);
  const iv = randomBytes(ACCOUNT_EXPORT_IV_BYTES);
  const cipher = createCipheriv(ACCOUNT_EXPORT_ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintextBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const encryptedPayload = {
    version: 1,
    algorithm: ACCOUNT_EXPORT_ALGORITHM,
    keyId,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    metadata: {
      plaintextBytes: plaintextBuffer.byteLength,
    },
  };

  const fileContents = JSON.stringify(encryptedPayload, null, 2);
  await fs.writeFile(absolutePath, fileContents, "utf8");

  const bytes = Buffer.byteLength(fileContents, "utf8");
  const checksum = createHash("sha256").update(fileContents).digest("hex");

  return {
    absolutePath,
    storagePath: relative(process.cwd(), absolutePath),
    bytes,
    checksum,
  };
}

function resolveEncryptionMaterial(env: ReturnType<typeof getServerEnv>): { key: Buffer; keyId: string } {
  const explicitKey = env.ACCOUNT_EXPORT_ENCRYPTION_KEY?.trim();

  if (explicitKey) {
    const key = Buffer.from(explicitKey, "base64");
    if (key.length !== ACCOUNT_EXPORT_KEY_BYTES) {
      throw new Error("ACCOUNT_EXPORT_ENCRYPTION_KEY must decode to 32 bytes.");
    }

    return { key, keyId: deriveKeyId(key, env.ACCOUNT_EXPORT_KEY_ID) };
  }

  if (env.NODE_ENV === "production") {
    throw new Error("ACCOUNT_EXPORT_ENCRYPTION_KEY is required in production environments.");
  }

  let key = cachedDevelopmentKey;
  if (!key) {
    key = randomBytes(ACCOUNT_EXPORT_KEY_BYTES);
    cachedDevelopmentKey = key;
  }

  if (!devKeyNoticeLogged) {
    console.warn(
      "[account-export] Generated ephemeral encryption key for development/test. Set ACCOUNT_EXPORT_ENCRYPTION_KEY to persist bundles across restarts.",
    );
    devKeyNoticeLogged = true;
  }

  return {
    key,
    keyId: deriveKeyId(key, env.ACCOUNT_EXPORT_KEY_ID),
  };
}

function deriveKeyId(key: Buffer, providedKeyId: string | undefined): string {
  const trimmed = providedKeyId?.trim();
  if (trimmed) {
    return trimmed;
  }

  return createHash("sha256").update(key).digest("hex").slice(0, 16);
}
