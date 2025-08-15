// Vercel serverless function: /api/ics?url=<encoded-ics-url>
export default async function handler(req, res) {
  // CORS + preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.status(204).end();
    return;
  }

  const allowed = new Set([
    'www.airbnb.com', 'airbnb.com',
    'ical.booking.com',
    'app.pingotel.com' // keep for later if Pingotel gives .ics
  ]);

  const url = req.query.url;
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!url) return res.status(400).send('Missing ?url');

  let u;
  try { u = new URL(url); } catch { return res.status(400).send('Bad URL'); }
  if (u.protocol !== 'https:') return res.status(400).send('Only https');
  if (!allowed.has(u.hostname)) return res.status(403).send('Blocked host: ' + u.hostname);

  try {
    const r = await fetch(u.toString(), { headers: { 'Accept': 'text/calendar' } });
    const text = await r.text();
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(r.status).send(text);
  } catch (e) {
    res.status(502).send('Upstream fetch failed: ' + e.message);
  }
}
