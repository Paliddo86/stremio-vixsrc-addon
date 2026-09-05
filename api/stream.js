const VixSrcService = require('../src/extractors/vixsrc');

module.exports = async (req, res) => {
  try {
    // Expecting query params: type, id (e.g. anything passed from Stremio like imdb:tt0111161 or tmdb:12345)
    const { type, id } = req.query;
    if (!type || !id) return res.status(400).json({ error: 'Missing type or id' });

    // Use the id as passed by Stremio. If it contains a prefix (imdb:tmdb:), take the part after ':'
    const rawId = id.includes(':') ? id.split(':')[1] : id;
    const vixId = rawId;

    if (type === 'movie') {
      const finalUrl = await VixSrcService.getMovieUrl(vixId);
      return res.json({ streams: [ { title: 'vixsrc', url: finalUrl, quality: 'HD', isRemote: true } ] });
    }

    // type === series -> expect season and episode query params
    if (type === 'series' || type === 'tv') {
      const season = parseInt(req.query.season || req.query.s || '1', 10);
      const episode = parseInt(req.query.episode || req.query.e || '1', 10);
      const finalUrl = await VixSrcService.getTvShowUrl(vixId, season, episode);
      return res.json({ streams: [ { title: 'vixsrc', url: finalUrl, quality: 'HD', isRemote: true } ] });
    }

    return res.status(400).json({ error: 'Unsupported type' });
  } catch (err) {
    console.error('stream handler error', err);
    return res.status(500).json({ error: err.message || 'internal' });
  }
};
