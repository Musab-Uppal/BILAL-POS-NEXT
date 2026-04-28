const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await supabase.from('receipts').select('*').limit(1);
    if (error) console.error(error);
    else if (data && data.length > 0) console.log('Supabase receipts columns:', Object.keys(data[0]));
    else console.log('No data in Supabase receipts');
}

run();
