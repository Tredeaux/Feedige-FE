import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Type-safe, validated environment variables. Importing from here (instead of
 * reading `process.env` directly) guarantees the value exists and is the right
 * shape — a missing/invalid var fails fast at build/startup.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3001"),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  emptyStringAsUndefined: true,
});
