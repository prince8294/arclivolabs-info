import { z } from "zod";
import { safeUrl } from "@/lib/validations/common";

const serverEnvironmentSchema = z.object({
  MONGODB_URI: z.string().min(1).refine(
    (value) => value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"),
    "Expected a MongoDB connection string.",
  ),
  AUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: safeUrl,
  NEXT_PUBLIC_APP_URL: safeUrl,
});

export function validateServerEnvironment(environment: NodeJS.ProcessEnv = process.env) {
  const parsed = serverEnvironmentSchema.safeParse(environment);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))];
    throw new Error(`Required server environment is invalid: ${fields.join(", ")}.`);
  }
  return parsed.data;
}
