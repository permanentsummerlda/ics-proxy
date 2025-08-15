// Netlify Function: /.netlify/functions/ics?url=<encoded-ics-url>
exports.handler = async (event) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS };

  const allowed = new Set(['www.airbnb.com','airbnb.com','ical.booking.com','app.pingotel.com']);
  const target = event.queryStringParameters.url;
  if (!target) return { statusCode: 400, headers: CORS, body: 'Missing ?url' };

  let u;
  try { u = new URL(target); } catch { return { statusCode: 400, headers: CORS, body: 'Bad URL' }; }
  if (u.protocol !== 'https:') return { statusCode: 400, headers: CORS, body: 'Only https' };
  if (!allowed.has(u.hostname)) return { statusCode: 403, headers: CORS, body: 'Blocked host: '+u.hostname };

  try {
    const resp = await fetch(u.toString(), { headers: { 'Accept': 'text/calendar' } });
    const text = await resp.text();
    return {
      statusCode: resp.status,
      headers: { ...CORS, 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control':'public, max-age=300' },
      body: text
    };
  } catch (e) {
    return { statusCode: 502, headers: CORS, body: 'Upstream fetch failed: '+e.message };
  }
};
