import { createHash } from "node:crypto";
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
  await fs.writeFile(absolutePath, serialised, "utf8");

  const bytes = Buffer.byteLength(serialised, "utf8");
  const checksum = createHash("sha256").update(serialised).digest("hex");

  return {
    absolutePath,
    storagePath: relative(process.cwd(), absolutePath),
    bytes,
    checksum,
  };
}
