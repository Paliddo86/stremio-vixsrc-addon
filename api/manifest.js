module.exports = (req, res) => {
  // Redirect legacy API manifest requests to the static manifest in /public
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    return res.end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Location', '/manifest.json');
  res.statusCode = 302;
  return res.end();
};
