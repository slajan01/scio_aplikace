import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Vytvoříme jednoho klienta pro celou aplikaci
const client = postgres(process.env.DATABASE_URL!);

// A jednu instanci Drizzle, kterou budeme všude importovat
export const db = drizzle(client, { schema });