const manifest = require('../public/manifest.json');

module.exports = (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    return res.end();
  }

  // Always expose CORS headers on responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  try {
    res.statusCode = 200;
    return res.end(JSON.stringify(manifest));
  } catch (err) {
    console.error('manifest serve error', err);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'internal' }));
  }
};
