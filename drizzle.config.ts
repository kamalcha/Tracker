import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    // 1. Where your TypeScript schema is defined
    schema: './src/lib/db/schema.ts',

    // 2. Where Drizzle will store your database migration files
    out: './drizzle',

    // 3. The type of database you are using
    dialect: 'postgresql',

    // 4. Your connection details (pulling from your .env file)
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});