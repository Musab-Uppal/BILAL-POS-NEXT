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
            const orderSchema = data.definitions.order;
            const orderItemsSchema = data.definitions.order_items;
            console.log('Order columns:', Object.keys(orderSchema.properties));
            console.log('OrderItems columns:', Object.keys(orderItemsSchema.properties));
        } catch (e) {
            console.error('Error:', e.message);
        }
    });
});

req.on('error', (e) => console.error(e));
req.end();
