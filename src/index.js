const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Config
const TMDB_KEY = process.env.TMDB_KEY || null;
const VIXSRC_KEY = process.env.VIXSRC_KEY || null;

// Abilita CORS per permettere a Stremio di comunicare
app.use(cors());
app.use(express.json());

// Root endpoint - Stremio cerca questo per primo
app.get('/', (req, res) => {
  res.json({
    id: 'org.paliddo86.stremio.vixsrc',
    version: '0.1.0',
    name: 'Vixsrc Streams',
    description: 'Risolvi stream da Vixsrc per film e serie TV',
    resources: ['stream', 'meta'],
    types: ['movie', 'series'],
    idPrefixes: ['tt', 'tmdb:'],
    catalogs: []
  });
});

// Manifest endpoint
app.get('/manifest.json', (req, res) => {
  res.json({
    id: 'org.paliddo86.stremio.vixsrc',
    version: '0.1.0',
    name: 'Vixsrc Streams',
    description: 'Risolvi stream da Vixsrc per film e serie TV',
    resources: ['stream', 'meta'],
    types: ['movie', 'series'],
    idPrefixes: ['tt', 'tmdb:'],
    catalogs: []
  });
});

// Meta endpoint con supporto .json
app.get('/meta/:type/:id.json', async (req, res) => {
  const { type, id } = req.params;
  console.log(`Meta request: type=${type}, id=${id}`);
  try {
    const meta = await resolveMeta(type, id);
    if (!meta) return res.status(404).json({ meta: null });
    res.json({ meta });
  } catch (err) {
    console.error('meta error', err);
    res.status(500).json({ error: 'internal' });
  }
});

// Meta endpoint senza .json
app.get('/meta/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  console.log(`Meta request: type=${type}, id=${id}`);
  try {
    const meta = await resolveMeta(type, id);
    if (!meta) return res.status(404).json({ meta: null });
    res.json({ meta });
  } catch (err) {
    console.error('meta error', err);
    res.status(500).json({ error: 'internal' });
  }
});

// Stream endpoint con supporto .json
app.get('/stream/:type/:id.json', async (req, res) => {
  const { type, id } = req.params;
  console.log(`Stream request: type=${type}, id=${id}`);
  try {
    const streams = await findStreams(type, id);
    res.json({ streams });
  } catch (err) {
    console.error('stream error', err);
    res.status(500).json({ error: 'internal' });
  }
});

// Stream endpoint senza .json
app.get('/stream/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  console.log(`Stream request: type=${type}, id=${id}`);
  try {
    const streams = await findStreams(type, id);
    res.json({ streams });
  } catch (err) {
    console.error('stream error', err);
    res.status(500).json({ error: 'internal' });
  }
});

// Endpoint di test per verificare che l'addon funzioni
app.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Addon funzionante',
    timestamp: new Date().toISOString(),
    config: {
      has_tmdb_key: !!TMDB_KEY,
      has_vixsrc_key: !!VIXSRC_KEY
    }
  });
});

app.listen(PORT, () => {
  console.log(`Stremio Vixsrc Addon running on http://localhost:${PORT}`);
  console.log(`TMDB Key configured: ${!!TMDB_KEY}`);
  console.log(`Vixsrc Key configured: ${!!VIXSRC_KEY}`);
});

// Helper functions
async function resolveMeta(type, id) {
  let cleanId = id;
  
  // Rimuovi estensione .json se presente
  if (cleanId.endsWith('.json')) {
    cleanId = cleanId.replace('.json', '');
  }
  
  // Gestisci vari formati di ID
  if (cleanId.startsWith('imdb:')) {
    cleanId = cleanId.replace('imdb:', '');
  }
  
  if (cleanId.startsWith('tmdb:')) {
    const tmdbId = cleanId.split(':')[1];
    return await fetchTmdbMetaByTmdbId(type, tmdbId);
  }
  
  // Se è un ID IMDb (es: tt1234567)
  if (cleanId.startsWith('tt')) {
    return await fetchTmdbMetaByImdbId(type, cleanId);
  }
  
  return null;
}

async function findStreams(type, id) {
  let cleanId = id;
  
  // Rimuovi estensione .json se presente
  if (cleanId.endsWith('.json')) {
    cleanId = cleanId.replace('.json', '');
  }
  
  // Gestisci vari formati di ID
  if (cleanId.startsWith('imdb:')) {
    cleanId = cleanId.replace('imdb:', '');
  }
  
  let imdbId = null;
  
  if (cleanId.startsWith('tt')) {
    imdbId = cleanId;
  } else if (cleanId.startsWith('tmdb:')) {
    const tmdbId = cleanId.split(':')[1];
    const meta = await fetchTmdbMetaByTmdbId(type, tmdbId);
    imdbId = meta && meta.imdb_id ? meta.imdb_id : null;
  }

  console.log(`Finding streams for imdb: ${imdbId}, tmdb: ${cleanId.startsWith('tmdb:') ? cleanId.split(':')[1] : null}`);
  
  const streams = await fetchVixsrcStreams({ 
    imdb: imdbId, 
    tmdb: cleanId.startsWith('tmdb:') ? cleanId.split(':')[1] : null 
  });
  
  return streams;
}

async function fetchTmdbMetaByImdbId(type, imdbId) {
  if (!TMDB_KEY) {
    console.warn('TMDB_KEY mancante: restituisco meta minimale');
    return {
      id: imdbId,
      imdb_id: imdbId,
      name: `Movie ${imdbId}`,
      type: type
    };
  }

  try {
    const url = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_KEY}&language=it-IT&external_source=imdb_id`;
    console.log(`Fetching TMDB meta for IMDb ID: ${imdbId}`);
    const r = await fetch(url).then(res => res.json());
    
    const results = (r.movie_results && r.movie_results.length) ? 
      r.movie_results : 
      (r.tv_results && r.tv_results.length ? r.tv_results : null);
    
    if (!results) {
      console.log(`No TMDB results for IMDb ID: ${imdbId}`);
      return null;
    }
    
    const item = results[0];
    
    return {
      id: item.id,
      imdb_id: imdbId,
      name: item.title || item.name,
      overview: item.overview,
      year: (item.release_date || item.first_air_date || '').slice(0,4),
      type: type,
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      background: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null
    };
  } catch (error) {
    console.error('TMDB find error:', error);
    return null;
  }
}

async function fetchTmdbMetaByTmdbId(type, tmdbId) {
  if (!TMDB_KEY) {
    console.warn('TMDB_KEY mancante: restituisco meta minimale');
    return { id: tmdbId, imdb_id: null, name: `Content ${tmdbId}`, type: type };
  }
  
  try {
    const path = (type === 'movie') ? 'movie' : 'tv';
    const url = `https://api.themoviedb.org/3/${path}/${tmdbId}?api_key=${TMDB_KEY}&language=it-IT`;
    console.log(`Fetching TMDB meta for TMDB ID: ${tmdbId}`);
    const r = await fetch(url).then(res => res.json());
    
    if (r.status_code) {
      console.log(`TMDB API error: ${r.status_message}`);
      return null;
    }
    
    return {
      id: r.id,
      imdb_id: r.imdb_id || null,
      name: r.title || r.name,
      overview: r.overview,
      year: (r.release_date || r.first_air_date || '').slice(0,4),
      type: type,
      poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
      background: r.backdrop_path ? `https://image.tmdb.org/t/p/original${r.backdrop_path}` : null
    };
  } catch (error) {
    console.error('TMDB fetch error:', error);
    return null;
  }
}

async function fetchVixsrcStreams({ imdb = null, tmdb = null }) {
  console.log(`Fetching Vixsrc streams - imdb: ${imdb}, tmdb: ${tmdb}`);
  
  if (!VIXSRC_KEY) {
    console.warn('VIXSRC_KEY mancante: ritorno stream di esempio');
    return [
      {
        title: 'Esempio Stream (placeholder)',
        url: 'https://example.com/stream/placeholder.m3u8',
        quality: 'HD',
        behaviorHints: {
          notWebReady: false
        }
      }
    ];
  }

  try {
    const query = imdb ? `imdb=${encodeURIComponent(imdb)}` : `tmdb=${encodeURIComponent(tmdb)}`;
    const apiUrl = `https://api.vixsrc.to/streams?${query}&key=${VIXSRC_KEY}`;
    console.log(`Calling Vixsrc API: ${apiUrl}`);
    const r = await fetch(apiUrl).then(res => res.json());
    
    if (!r || !Array.isArray(r.streams)) {
      console.log('No streams found from Vixsrc');
      return [];
    }
    
    return r.streams.map(s => ({
      title: s.title || '',
      url: s.url,
      quality: s.quality || 'SD',
      behaviorHints: {
        notWebReady: false
      }
    }));
  } catch (err) {
    console.error('vixsrc api error', err);
    return [];
  }
}