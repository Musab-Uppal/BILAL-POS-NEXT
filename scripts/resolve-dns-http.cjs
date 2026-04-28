const https = require('https');

https.get('https://dns.google/resolve?name=db.dtlbgtvvvbxdheailbvf.supabase.co&type=A', (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            const data = JSON.parse(body);
            console.log('Google DNS (A):', data.Answer);
        } catch (e) {
            console.error(e);
        }
    });
}).on('error', (e) => {
    console.error('Google DNS failed:', e.message);
});

https.get('https://cloudflare-dns.com/dns-query?name=db.dtlbgtvvvbxdheailbvf.supabase.co&type=A', { headers: { 'accept': 'application/dns-json' } }, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            const data = JSON.parse(body);
            console.log('Cloudflare DNS (A):', data.Answer);
        } catch (e) {
            console.error(e);
        }
    });
}).on('error', (e) => {
    console.error('Cloudflare DNS failed:', e.message);
});
