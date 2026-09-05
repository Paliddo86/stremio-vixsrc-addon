const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Config
const TMDB_KEY = process.env.TMDB_KEY || null; // inserisci la tua TMDB API key
const VIXSRC_KEY = process.env.VIXSRC_KEY || null; // opzionale, per le API di vixsrc se richieste

// Semplice manifest conforme all'API degli Stremio addons
app.get('/manifest.json', (req, res) => {
  res.json({
    id: 'org.paliddo86.stremio.vixsrc',
    version: '0.1.0',
    name: 'Stremio Vixsrc Addon (esempio)',
    description: 'Addon esempio che risolve id TMDB/IMDB e usa vixsrc.to per trovare stream (stub)',
    resources: ['stream', 'meta'],
    types: ['movie', 'series'],
    idPrefixes: ['imdb:', 'tmdb:']
  });
});

// Endpoint meta: restituisce metadati richiesti da Stremio
// Stremio chiama: /meta/{type}/{id}
app.get('/meta/:type/:id', async (req, res) => {
  const { type, id } = req.params; // id viene passato come "imdb:tt..." o "tmdb:12345"
  try {
    const meta = await resolveMeta(type, id);
    if (!meta) return res.status(404).json({ meta: null });
    res.json({ meta });
  } catch (err) {
    console.error('meta error', err);
    res.status(500).json({ error: 'internal' });
  }
});

// Endpoint stream: /stream/{type}/{id}
// Deve restituire { streams: [ { title, url, quality, ... } ] }
app.get('/stream/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  try {
    // id format: "imdb:tt123..." or "tmdb:12345"
    const streams = await findStreams(type, id);
    res.json({ streams });
  } catch (err) {
    console.error('stream error', err);
    res.status(500).json({ error: 'internal' });
  }
});

app.listen(PORT, () => {
  console.log(`Stremio Vixsrc Addon running on http://localhost:${PORT}`);
});

// ---------------- Helper functions ----------------

async function resolveMeta(type, id) {
  // If id is tmdb:xxxxx return minimal meta, if imdb:id translate via TMDB
  if (id.startsWith('tmdb:')) {
    const tmdbId = id.split(':')[1];
    return await fetchTmdbMetaByTmdbId(type, tmdbId);
  }
  if (id.startsWith('imdb:')) {
    const imdbId = id.split(':')[1];
    return await fetchTmdbMetaByImdbId(type, imdbId);
  }
  return null;
}

async function findStreams(type, id) {
  // Prefer passing imdb id to vixsrc if available
  let imdbId = null;
  if (id.startsWith('imdb:')) imdbId = id.split(':')[1];
  else if (id.startsWith('tmdb:')) {
    const tmdbId = id.split(':')[1];
    const meta = await fetchTmdbMetaByTmdbId(type, tmdbId);
    imdbId = meta && meta.imdb_id ? meta.imdb_id : null;
  }

  // Call vixsrc client (stub). If no key or api not available, ritorna un placeholder di esempio.
  const streams = await fetchVixsrcStreams({ imdb: imdbId, tmdb: id.startsWith('tmdb:') ? id.split(':')[1] : null });
  return streams;
}

// ---------------- TMDB helpers (usano TMDB API) ----------------

async function fetchTmdbMetaByImdbId(type, imdbId) {
  if (!TMDB_KEY) {
    console.warn('TMDB_KEY mancante: restituisco meta minimale');
    return {
      id: imdbId,
      imdb_id: imdbId,
      name: `Imdb ${imdbId}`
    };
  }

  // TMDB find by external id
  const url = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_KEY}&language=it-IT&external_source=imdb_id`;
  const r = await fetch(url).then(r => r.json());
  // i risultati contengono movie_results, tv_results
  const results = (r.movie_results && r.movie_results.length) ? r.movie_results : (r.tv_results && r.tv_results.length ? r.tv_results : null);
  if (!results) return null;
  const item = results[0];
  return {
    id: item.id,
    imdb_id: imdbId,
    name: item.title || item.name,
    overview: item.overview,
    year: (item.release_date || item.first_air_date || '').slice(0,4)
  };
}

async function fetchTmdbMetaByTmdbId(type, tmdbId) {
  if (!TMDB_KEY) {
    console.warn('TMDB_KEY mancante: restituisco meta minimale');
    return { id: tmdbId, imdb_id: null, name: `Tmdb ${tmdbId}` };
  }
  const path = (type === 'movie') ? 'movie' : 'tv';
  const url = `https://api.themoviedb.org/3/${path}/${tmdbId}?api_key=${TMDB_KEY}&language=it-IT`;
  const r = await fetch(url).then(r => r.json());
  if (r.status_code) return null;
  return {
    id: r.id,
    imdb_id: r.imdb_id || null,
    name: r.title || r.name,
    overview: r.overview,
    year: (r.release_date || r.first_air_date || '').slice(0,4)
  };
}

// ---------------- Vixsrc client (stub) ----------------

async function fetchVixsrcStreams({ imdb = null, tmdb = null }) {
  // NOTE: vixsrc.to non ha una API pubblica documentata in questo repository.
  // Questo è uno stub che prova a chiamare un ipotetico endpoint. Dovrai adattarlo
  // alle API reali o fare scraping, verificando la liceità d'uso.

  if (!VIXSRC_KEY) {
    console.warn('VIXSRC_KEY mancante: ritorno stream di esempio');
    return [
      {
        title: 'Esempio Stream (placeholder)',
        url: 'https://example.com/stream/placeholder.m3u8',
        quality: 'HD',
        info: imdb || tmdb
      }
    ];
  }

  // Esempio di chiamata a ipotetica API:
  try {
    const query = imdb ? `imdb=${encodeURIComponent(imdb)}` : `tmdb=${encodeURIComponent(tmdb)}`;
    const apiUrl = `https://api.vixsrc.to/streams?${query}&key=${VIXSRC_KEY}`;
    const r = await fetch(apiUrl).then(r => r.json());
    // mappa il risultato al formato atteso
    if (!r || !Array.isArray(r.streams)) return [];
    return r.streams.map(s => ({ title: s.title || '', url: s.url, quality: s.quality || 'SD' }));
  } catch (err) {
    console.error('vixsrc api error', err);
    return [];
  }
}
