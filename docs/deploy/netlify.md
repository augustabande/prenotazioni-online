# Deploy Frontend — Netlify

## 1. Creare il sito

1. Vai su [netlify.com](https://netlify.com) → **Add new site → Import from Git**
2. Connetti il repository GitHub `kami-experience`
3. Configurazione build (auto-rilevata da `frontend/netlify.toml`):
   - **Base directory**: `frontend`
   - **Build command**: `cd .. && npx pnpm install --frozen-lockfile && npx nx build frontend --configuration=production && node scripts/inject-env.js`
   - **Publish directory**: `../dist/frontend/browser`

## 2. Configurare le Environment Variables

In **Site settings → Environment variables**:

| Variabile | Valore | Note |
|---|---|---|
| `API_URL` | `https://kite-booking-api.onrender.com/api` | URL backend su Render |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Da Supabase dashboard |
| `SUPABASE_ANON_KEY` | `eyJ...` | Anon key (pubblica, ok nel frontend) |
| `STRIPE_PUBLIC_KEY` | `pk_test_...` | Da Stripe dashboard |

> ⚠️ Lo script `scripts/inject-env.js` sostituisce i placeholder `__API_URL__`, `__SUPABASE_URL__`, ecc. nei file JS compilati con i valori delle env vars di Netlify.

## 3. Deploy

1. Clicca **Deploy site**
2. Netlify esegue il build e pubblica
3. Il sito sarà disponibile su `https://random-name.netlify.app`

## 4. Configurare il dominio

1. **Domain management → Add custom domain**
2. Aggiungi `kamikite.com` o `demo.kamikite.com`
3. Configura DNS come indicato
4. Netlify gestisce automaticamente HTTPS via Let's Encrypt

## 5. Aggiornare CORS nel backend

Dopo aver ottenuto l'URL Netlify definitivo, aggiorna la variabile `CORS_ORIGIN` su Render:

```
CORS_ORIGIN=https://tuo-sito.netlify.app,https://deploy-preview-*--tuo-sito.netlify.app
```

## 6. Verificare

1. Apri `https://tuo-sito.netlify.app`
2. Verifica che la landing page si carichi con gli stili Tailwind
3. Naviga su `/lezioni` — verifica che le lesson types vengano caricate dall'API
4. Verifica che il routing SPA funzioni (refresh su `/lezioni` non dà 404)

## Note

- Le **Deploy Previews** sono attive di default per ogni PR
- Il build usa `pnpm` + Nx, il cache Nx accelera i build successivi
- I redirect `/* → /index.html` gestiscono il routing Angular (SPA)
- Gli asset statici hanno header `Cache-Control: immutable` per performance
