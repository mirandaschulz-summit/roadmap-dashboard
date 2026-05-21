export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { domain, email, token, path, ...rest } = req.query;

  if (!domain || !email || !token || !path) {
    return res.status(400).json({ error: 'Missing required query params: domain, email, token, path' });
  }

  // Clean domain — strip protocol and trailing slash
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Rebuild any extra query params (jql, fields, maxResults, etc.) that were passed through
  const extraParams = new URLSearchParams(rest).toString();
  const jiraUrl = `https://${cleanDomain}${path}${extraParams ? '?' + extraParams : ''}`;

  const credentials = Buffer.from(`${email}:${token}`).toString('base64');

  try {
    const response = await fetch(jiraUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy fetch failed', details: err.message });
  }
}
