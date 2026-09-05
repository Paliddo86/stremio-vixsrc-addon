module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    id: 'org.paliddo86.stremio.vixsrc',
    version: '0.2.0',
    name: 'Stremio Vixsrc Addon (integrated)',
    description: 'Addon che usa vixsrc.to per trovare stream. Usa l\'id passato da Stremio (non serve TMDB/IMDB mapping).',
    resources: ['stream', 'meta'],
    types: ['movie', 'series'],
    idPrefixes: ['imdb:', 'tmdb:', 'vix:']
  }));
};
