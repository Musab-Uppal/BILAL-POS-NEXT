const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const databasePassword = process.env.DATABASE_PASSWORD || process.env.SUPABASE_PASSWORD;
const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];

const client = new Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    user: 'postgres',
    password: databasePassword,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
});

async function run() {
    await client.connect();
    try {
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'receipts' 
            ORDER BY ordinal_position;
        `);
        console.log('Columns in receipts:', res.rows);
    } finally {
        await client.end();
    }
}

run().catch(console.error);
