export default async function handler(req, res) {
  // Allow requests from the browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { domain, email, token, path } = req.query;

  if (!domain || !email || !token || !path) {
    return res.status(400).json({ error: 'Missing required query params: domain, email, token, path' });
  }

  const jiraUrl = `https://${domain}${path}`;
  const credentials = Buffer.from(`${email}:${token}`).toString('base64');

  try {
    const response = await fetch(jiraUrl, {
      method: req.method === 'GET' ? 'GET' : req.method,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      ...(req.method !== 'GET' && req.body ? { body: JSON.stringify(req.body) } : {}),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy fetch failed', details: err.message });
  }
}
