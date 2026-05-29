const LOOPS_URL = 'https://app.loops.so/api/v1/contacts/create';

export async function onRequestPost(context) {
  try {
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
    headers: { 'Content-Type': 'application/json' },
  });
}
