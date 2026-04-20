# Deploy Backend — Render

## 1. Creare il servizio

1. Vai su [render.com](https://render.com) → **New → Web Service**
2. Connetti il repository GitHub `kami-experience`
3. Configurazione:
   - **Name**: `kite-booking-api`
   - **Region**: Frankfurt (EU Central)
   - **Runtime**: Docker
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Plan**: Starter ($7/mese) o Free (con cold start)

> 💡 In alternativa, usa il file `render.yaml` nella root: vai su **Blueprints → New Blueprint Instance** e seleziona il repo. Render leggerà automaticamente la configurazione.

## 2. Configurare le Environment Variables

Nel dashboard Render, sezione **Environment**:

| Variabile | Valore | Note |
|---|---|---|
| `NODE_ENV` | `production` | |
| `PORT` | `3000` | |
| `DATABASE_URL` | `postgresql://postgres.[ref]:...` | Pooler URL da Supabase |
| `CORS_ORIGIN` | `https://tuo-sito.netlify.app` | Comma-separated per più domini |
| `JWT_SECRET` | (genera stringa random 64 char) | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `1d` | |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Da Supabase dashboard |
| `SUPABASE_JWT_SECRET` | (da Supabase JWT Settings) | |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Da Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Dopo aver creato il webhook |
| `RESEND_API_KEY` | `re_...` | Da Resend dashboard |

## 3. Deploy

1. Clicca **Create Web Service** (o **Apply** se usi Blueprint)
2. Render builda il Docker image e deploya
3. Attendi che il health check passi: vedrai ✅ **Live** nel dashboard

## 4. Verificare

```bash
# Sostituisci con il tuo URL Render
curl https://kite-booking-api.onrender.com/api/health
# → {"status":"ok","db":"reachable","timestamp":"..."}

# Smoke test completo
bash scripts/smoke-test.sh https://kite-booking-api.onrender.com
```

## 5. Custom Domain (opzionale)

1. **Settings → Custom Domains → Add Custom Domain**
2. Aggiungi `api.kamikite.com`
3. Configura il CNAME DNS come indicato da Render
4. Render gestisce automaticamente il certificato SSL

## Note

- Il piano **Free** ha cold start (~30s dopo inattività). Per la demo è accettabile
- Il piano **Starter** ($7/mese) mantiene il servizio sempre attivo
- I log sono visibili in **Logs** nel dashboard
- Auto-deploy è attivo di default su push al branch principale
