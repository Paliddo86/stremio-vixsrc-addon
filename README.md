# Stremio Vixsrc Addon (esempio)

Questo repository contiene un addon di esempio per Stremio che riceve gli ID da Stremio (imdb:tt..., tmdb:12345), risolve i metadati via TMDB (se fornita la TMDB_KEY) e tenta di recuperare stream tramite vixsrc.to (stub).

Nota importante: il codice per l'accesso effettivo a vixsrc.to è uno stub. Dovrai adattare la parte di fetch al servizio reale e assicurarti di rispettare i termini di servizio e le leggi sul copyright.

Files principali
- src/index.js - server Express con gli endpoint /manifest.json, /meta/:type/:id e /stream/:type/:id
- package.json

Variabili d'ambiente richieste
- TMDB_KEY (opzionale ma consigliata) - la tua TMDB API key per risolvere imdb <-> tmdb e ottenere metadati
- VIXSRC_KEY (opzionale) - se hai accesso a un'API key per vixsrc
- PORT (opzionale) - porta per il server locale (default 3000)

Come testare in locale
1. Clona il repo
2. npm install
3. Esporta le variabili d'ambiente se disponibili (es. TMDB_KEY)
   export TMDB_KEY=tuatmdbkey
   export VIXSRC_KEY=tuavixkey
4. npm start
5. Apri http://localhost:3000/manifest.json per verificare il manifest
6. Chiamata di test metadati: http://localhost:3000/meta/movie/imdb:tt0111161
7. Chiamata di test stream: http://localhost:3000/stream/movie/imdb:tt0111161

Deploy su host gratuiti
- Vercel: carica il progetto, imposta le variabili d'ambiente in Settings. Se usi Vercel Serverless Functions potresti dover adattare `src/index.js` in una funzione `api/index.js`.
- Cloudflare Workers: l'app attuale è un server Express — puoi riscrivere la logica in un Worker (o usare `wrangler dev` + adapter). In README ho incluso istruzioni di base.

Riferimenti
- Repo di riferimento fornito dall'autore: Paliddo86/itaflix-tvOS (usalo come documentazione e ispirazione)

Licenza
MIT
