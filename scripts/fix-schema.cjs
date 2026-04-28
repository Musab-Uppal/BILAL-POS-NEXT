const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const databasePassword = process.env.DATABASE_PASSWORD || process.env.SUPABASE_PASSWORD;
// Use IPv6 if hostname resolution fails, but we'll try hostname first.
// If it fails, we'll try the IPv6 address found earlier.
const host = 'db.dtlbgtvvvbxdheailbvf.supabase.co';
const ipv6 = '2406:da18:243:7429:4d42:d786:50f4:c187';

async function run(targetHost) {
    console.log(`Connecting to ${targetHost}...`);
    const client = new Client({
        host: targetHost,
        port: 5432,
        user: 'postgres',
        password: databasePassword,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
    });

    try {
        await client.connect();
        console.log('Connected!');

        console.log('Altering receipts table...');
        await client.query(`
            ALTER TABLE receipts 
            ADD COLUMN IF NOT EXISTS payment_method TEXT,
            ADD COLUMN IF NOT EXISTS payment_status TEXT,
            ADD COLUMN IF NOT EXISTS store_name TEXT,
            ADD COLUMN IF NOT EXISTS store_address TEXT,
            ADD COLUMN IF NOT EXISTS store_phone TEXT,
            ADD COLUMN IF NOT EXISTS reprint_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS last_reprinted_at TIMESTAMPTZ;
        `);

        console.log('Schema update complete!');
    } catch (e) {
        console.error('Error:', e.message);
        if (targetHost === host) {
            console.log('Retrying with IPv6...');
            await run(ipv6);
        }
    } finally {
        await client.end();
    }
}

run(host).catch(console.error);
