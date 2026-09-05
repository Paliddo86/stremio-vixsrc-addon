module.exports = (req, res) => {
  // Respond to CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    return res.end();
  }

  const manifest = {
    id: 'org.paliddo86.stremio.vixsrc',
    version: '1.0.0',
    name: 'Stremio Vixsrc Addon (integrated)',
    description: "Addon che usa vixsrc.to per trovare stream. Usa l'id passato da Stremio (non serve TMDB/IMDB mapping).",
    resources: ['stream', 'meta'],
    types: ['movie', 'series'],
    // Include common id prefixes used by Stremio
    idPrefixes: ['imdb:', 'tmdb:', 'vix:', 'tt'],
    catalogs: [],
    behaviorHints: { disableTrackers: true }
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(manifest));
};
