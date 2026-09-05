# Stremio Vixsrc Addon (esempio)

Questo repository contiene un addon di esempio per Stremio che riceve gli ID da Stremio (imdb:tt..., tmdb:12345), risolve i metadati via TMDB (se fornita la TMDB_KEY) e tenta di recuperare stream tramite vixsrc.to (integrazione adattata dal repo itaflix-tvos).

> Nota importante: l'estrattore integra la logica usata nel repo Paliddo86/itaflix-tvos per ricostruire la master playlist di vixsrc.to. Assicurati di usare questo codice rispettando i termini di servizio e la normativa sul copyright.

Files principali
- api/manifest.js - endpoint manifest (serverless per Vercel)
- api/meta.js - endpoint meta minimale (non richiede TMDB)
- api/stream.js - endpoint stream che utilizza l'extractor vixsrc
- src/extractors/vixsrc.js - extractor adattato dal tuo repo itaflix-tvos
- vercel.json - configurazione per deploy su Vercel

Aggiungi l'addon a Stremio (1-click)

Se il tuo manifest è già deployato su Vercel (o è raggiungibile pubblicamente), puoi aggiungerlo a Stremio con un solo click usando lo schema stremio://

[![Aggiungi a Stremio](https://img.shields.io/badge/Add%20to-Stremio-brightgreen)](stremio://addon?url=https://stremio-vixsrc-addon-ok1gfvxwf-paliddo-production.vercel.app/manifest.json)

Oppure clicca questo link diretto:

Aggiungi a Stremio: stremio://addon?url=https://stremio-vixsrc-addon-ok1gfvxwf-paliddo-production.vercel.app/manifest.json

Se il click non apre automaticamente Stremio (dipende dal browser/sistema), copia e incolla manualmente il manifest URL in Stremio:

Manifest URL (copia/incolla):

```
https://stremio-vixsrc-addon-ok1gfvxwf-paliddo-production.vercel.app/manifest.json
```

Istruzioni alternative — Aggiunta manuale tramite Stremio
1. Apri Stremio sul tuo dispositivo.
2. Vai in "Add-ons" -> "Developer" (o "My add-ons" nelle versioni più recenti).
3. Seleziona "Add add-on by URL" (o simile) e incolla il Manifest URL (sopra).
4. Conferma: Stremio caricherà il manifest e mostrerà l'addon.

Come testare in locale
1. Clona il repo
2. npm install
3. vercel dev (o `npm start` se scegli di esporre un server locale) 
4. Usa ngrok oppure `vercel dev` per avere un URL pubblico se vuoi testare l'addon da Stremio sullo stesso dispositivo o su dispositivi diversi.

Deploy su Vercel
- Importa il repository su Vercel e seleziona la branch `feature/integrate-vixsrc` (o `master` dopo il merge).
- Non sono richieste variabili d'ambiente per l'estrazione da vixsrc; TMDB_KEY è opzionale solo se vuoi meta arricchiti.

Esempi di endpoint
- Manifest: `https://<tuo-deploy>.vercel.app/manifest.json`
- Meta: `https://<tuo-deploy>.vercel.app/meta/movie/tmdb:12345` (o `imdb:tt...`)
- Stream: `https://<tuo-deploy>.vercel.app/stream/movie/tmdb:12345` (o `imdb:tt...`)

Licenza
MIT
