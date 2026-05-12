import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().default("file:./dev.db")
});

const parsed = envSchema.parse(process.env);

export const env = {
  port: parsed.PORT,
  databaseUrl: parsed.DATABASE_URL
};
