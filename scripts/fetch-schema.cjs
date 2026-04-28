const https = require('https');
const dotenv = require('dotenv');
dotenv.config();

const url = new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`);
const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'GET',
    headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            const data = JSON.parse(body);
            const receiptsSchema = data.definitions.receipts;
            if (receiptsSchema) {
                console.log('Receipts columns in Postgrest:', Object.keys(receiptsSchema.properties));
            } else {
                console.log('No receipts definition found');
            }
        } catch (e) {
            console.error('Error parsing response:', e.message);
            console.log('Response body:', body);
        }
    });
});

req.on('error', (e) => console.error(e));
req.end();
