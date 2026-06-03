const LOOPS_URL = 'https://app.loops.so/api/v1/contacts/create';

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  'app://legado',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age':       '86400',
    },
  })
}

export async function onRequestPost(context) {
  try {
    // Rate limit: 5 peticiones por IP por hora
    const ip = context.request.headers.get('CF-Connecting-IP') ?? 'unknown'
    const kv = context.env.CREDITS
    if (kv) {
      const hour    = Math.floor(Date.now() / 3_600_000)
      const rlKey   = `rl:sub:${ip}:${hour}`
      const count   = parseInt(await kv.get(rlKey) || '0')
      if (count >= 5) return json({ success: false, message: 'Too many requests' }, 429)
      await kv.put(rlKey, String(count + 1), { expirationTtl: 7200 })
    }

    const { email, language } = await context.request.json();

    if (!email) {
      return json({ success: false, message: 'Email required' }, 400);
    }

    const loopsApiKey = context.env.LOOPS_API_KEY;
    if (!loopsApiKey) return json({ success: false, message: 'Not configured' }, 503);

    const res  = await fetch(LOOPS_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + loopsApiKey },
      body:    JSON.stringify({ email, language: language || 'es' }),
    });
    const data = await res.json();

    if (data.success || (data.message && /already exist/i.test(data.message))) {
      return json({ success: true });
    }

    return json({ success: false, message: data.message || 'API error' });

  } catch (err) {
    return json({ success: false, message: 'Server error' }, 500);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'app://legado',
    },
  });
}
