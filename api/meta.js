module.exports = async (req, res) => {
  try {
    const { type, id } = req.query;
    if (!type || !id) return res.status(200).json({ meta: null });

    // Do not call TMDB. Return minimal meta so Stremio can call stream endpoint.
    const meta = {
      id,
      name: id,
      poster: null,
      posterShape: 'poster'
    };

    return res.status(200).json({ meta });
  } catch (err) {
    console.error('meta handler error', err);
    return res.status(500).json({ meta: null });
  }
};
