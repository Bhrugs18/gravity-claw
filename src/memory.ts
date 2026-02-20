import pg from 'pg';
import crypto from 'node:crypto';
const { Pool } = pg;
import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./config.js";

// 🐘 Postgres Client
const pool = new Pool({
    host: config.POSTGRES_HOST,
    port: config.POSTGRES_PORT,
    user: config.POSTGRES_USER,
    password: config.POSTGRES_PASSWORD,
    database: config.POSTGRES_DB,
});

// 🧊 Qdrant Client
const qdrant = new QdrantClient({ url: config.QDRANT_URL });

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

export interface MemoryContext {
    archival: string[];
    entities: Record<string, string>;
}

// Ensure Qdrant collection exists
async function ensureCollection() {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(c => c.name === config.QDRANT_COLLECTION);
    if (!exists) {
        console.log(`🚀 Creating Qdrant collection: ${config.QDRANT_COLLECTION}`);
        await qdrant.createCollection(config.QDRANT_COLLECTION, {
            vectors: {
                size: 1536, // Gemini embedding size
                distance: "Cosine",
            }
        });
    }
}

// Pre-initialize
ensureCollection().catch(err => console.error("❌ Qdrant Init Error:", err));

export async function getMemory(userId: number, currentText: string): Promise<MemoryContext> {
    try {
        // 1. Generate embedding
        const embedResult = await embedModel.embedContent(currentText);
        const embedding = embedResult.embedding.values;

        // 2. Semantic Search (Qdrant)
        const searchResult = await qdrant.search(config.QDRANT_COLLECTION, {
            vector: embedding,
            limit: 5,
            filter: {
                must: [{ key: "user_id", match: { value: userId } }]
            }
        });

        const archival = searchResult.map(res => `[${res.payload?.role}]: ${res.payload?.content}`);

        // 3. Fetch Entities (Postgres)
        const entitiesRes = await pool.query('SELECT key, value FROM entities WHERE user_id = $1', [userId]);
        const entities: Record<string, string> = {};
        entitiesRes.rows.forEach(row => entities[row.key] = row.value);

        return { archival, entities };
    } catch (error) {
        console.error("❌ Memory Module Error (GET):", error);
        return { archival: [], entities: {} };
    }
}

export async function saveMemory(userId: number, role: 'user' | 'assistant', content: string) {
    try {
        // 1. Save metadata to Postgres
        await pool.query(
            'INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)',
            [userId, role, content]
        );

        // 2. Save vector to Qdrant
        const embedResult = await embedModel.embedContent(content);
        const embedding = embedResult.embedding.values;

        await qdrant.upsert(config.QDRANT_COLLECTION, {
            wait: true,
            points: [
                {
                    id: crypto.randomUUID(), // Qdrant needs a UUID or integer
                    vector: embedding,
                    payload: {
                        user_id: userId,
                        role,
                        content,
                    }
                }
            ]
        });
    } catch (error) {
        console.error("❌ Save Memory Error:", error);
    }
}

export async function upsertEntity(userId: number, key: string, value: string) {
    try {
        await pool.query(
            `INSERT INTO entities (user_id, key, value, updated_at) 
             VALUES ($1, $2, $3, NOW()) 
             ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
            [userId, key, value]
        );
    } catch (error) {
        console.error("❌ Upsert Entity Error:", error);
    }
}
