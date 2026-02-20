import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
    TELEGRAM_BOT_TOKEN: z.string().min(1),
    GEMINI_API_KEY: z.string().min(1),
    ELEVENLABS_API_KEY: z.string().min(1),
    ALLOWED_USER_ID: z.string().transform((val) => Number(val)),
    POSTGRES_HOST: z.string().default('localhost'),
    POSTGRES_PORT: z.string().transform(Number).default('5432'),
    POSTGRES_USER: z.string().default('gravity'),
    POSTGRES_PASSWORD: z.string().default('claw'),
    POSTGRES_DB: z.string().default('gravity_memory'),
    QDRANT_URL: z.string().url().default('http://localhost:6333'),
    QDRANT_COLLECTION: z.string().default('gravity-claw-memory'),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
}

export const config = parsed.data;
