Deploy instructions for Vercel

This branch contains serverless API endpoints under /api to serve a Stremio addon manifest and stream/meta endpoints integrated with the vixsrc extractor from Paliddo86/itaflix-tvos.

Files of interest
- api/manifest.js    -> serves manifest.json
- api/meta.js        -> minimal meta endpoint (does not require TMDB)
- api/stream.js      -> calls the integrated vixsrc extractor and returns streams
- src/extractors/vixsrc.js -> ported extractor logic from Paliddo86/itaflix-tvos
- vercel.json        -> routes and build config for Vercel

Environment
- No API keys are required for vixsrc in this integration.
- Optionally set TMDB_KEY if you want richer metadata; not required for stream resolution.

How to deploy to Vercel (quick)
1. Go to https://vercel.com and import the repository Paliddo86/stremio-vixsrc-addon.
2. Choose the branch: feature/integrate-vixsrc.
3. In Project Settings -> Environment Variables, add TMDB_KEY if desired (optional).
4. Deploy.
5. After deployment, take the deployment URL (e.g. https://your-project.vercel.app) and add the addon to Stremio by using: https://your-project.vercel.app/manifest.json

Local testing with Vercel CLI
1. Install Vercel CLI: npm i -g vercel
2. From the repo root: vercel dev
3. Endpoints will be available at http://localhost:3000/manifest.json, /meta/{type}/{id}, /stream/{type}/{id}

How Stremio should call it
- Add the manifest URL in Stremio Developer Addons: https://your-deploy.vercel.app/manifest.json
- When Stremio requests streams, it will call: https://your-deploy.vercel.app/stream/movie/tmdb:12345 (or imdb:tt...)
- The addon will take the part after ':' as the id for vixsrc and attempt to resolve the HLS URL.

Notes and caveats
- The extractor uses eval-like parsing of the vixsrc page to reconstruct `window.masterPlaylist`. This matches the logic used in your reference repo. Treat with caution; it's necessary to parse embedded JS objects.
- Make sure the use of vixsrc streams complies with terms of service and copyright law in your jurisdiction.
