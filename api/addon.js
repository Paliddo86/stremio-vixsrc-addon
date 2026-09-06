const { addonBuilder } = require('stremio-addon-sdk');
const manifest = require('../public/manifest.json');
const VixSrcService = require('../src/extractors/vixsrc');

const builder = new addonBuilder(manifest);

// Helper to read extra params (supports array or object)
function getExtraValue(extra, name) {
  if (!extra) return undefined;
  if (Array.isArray(extra)) {
    const e = extra.find((x) => x && x.name === name);
    return e ? e.value : undefined;
  }
  return extra[name];
}

builder.defineMetaHandler(async (args) => {
  try {
    const { id } = args;
    if (!id) return { meta: null };

    // Minimal meta — let Stremio call stream handler for actual streams
    const meta = {
      id,
      name: id,
      poster: null,
      posterShape: 'poster'
    };

    return { meta };
  } catch (err) {
    console.error('meta handler error', err);
    return { meta: null };
  }
});

builder.defineStreamHandler(async (args) => {
  try {
    const { type, id, extra } = args;
    if (!type || !id) return { streams: [] };

    // Normalize id (handle prefixes like imdb:tt...)
    const rawId = id.includes(':') ? id.split(':')[1] : id;

    if (type === 'movie') {
      const finalUrl = await VixSrcService.getMovieUrl(rawId);
      return {
        streams: [
          {
            title: 'vixsrc',
            url: finalUrl,
            quality: 'HD',
            isRemote: true
          }
        ]
      };
    }

    // series / tv
    let season = getExtraValue(extra, 'season') || getExtraValue(extra, 's') || 1;
    let episode = getExtraValue(extra, 'episode') || getExtraValue(extra, 'e') || 1;
    season = parseInt(season, 10) || 1;
    episode = parseInt(episode, 10) || 1;

    const finalUrl = await VixSrcService.getTvShowUrl(rawId, season, episode);
    return {
      streams: [
        {
          title: 'vixsrc',
          url: finalUrl,
          quality: 'HD',
          isRemote: true
        }
      ]
    };
  } catch (err) {
    console.error('stream handler error', err);
    return { streams: [] };
  }
});

// Export a serverless-friendly handler with basic CORS/OPTIONS support
const iface = builder.getInterface();

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
  try {
    return iface(req, res);
  } catch (err) {
    console.error('addon interface error', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'internal' }));
  }
};
