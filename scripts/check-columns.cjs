const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function checkSchema() {
    const { data, error } = await supabase.rpc('inspect_table_columns', { table_name: 'receipts' });
    if (error) {
        // If RPC doesn't exist, try a raw query via a temporary function if possible,
        // or just try to select the column and see if it fails.
        console.log('Checking column existence via select...');
        const { error: selectError } = await supabase.from('receipts').select('payment_method').limit(1);
        if (selectError) {
            console.error('Column check failed:', selectError.message);
        } else {
            console.log('Column payment_method exists.');
        }
    } else {
        console.log('Columns:', data);
    }
}

checkSchema();
