module.exports = (req, res) => {
  const manifest = {
    id: 'org.paliddo86.stremio.vixsrc',
    version: '0.2.1',
    name: 'Stremio Vixsrc Addon (integrated)',
    description: "Addon che usa vixsrc.to per trovare stream. Usa l'id passato da Stremio (non serve TMDB/IMDB mapping).",
    resources: ['stream', 'meta'],
    types: ['movie', 'series'],
    idPrefixes: ['imdb:', 'tmdb:', 'vix:', 'tt'],
    catalogs: [],
    behaviorHints: { disableTrackers: true }
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(manifest));
};
