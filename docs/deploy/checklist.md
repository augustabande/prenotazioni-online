# Checklist Post-Deploy

## Smoke Test Automatico

```bash
bash scripts/smoke-test.sh https://kite-booking-api.onrender.com
```

Verifica:
- [x] `GET /api/health` → 200, `{"status":"ok","db":"reachable"}`
- [x] `GET /api/lesson-types` → 200, array con 5 lesson types
- [x] `GET /api/slots` → 200, array con slot disponibili

## Test End-to-End Manuale

### 1. Landing Page
- [ ] Apri `https://tuo-sito.netlify.app`
- [ ] Verifica che la pagina si carichi con stili Tailwind corretti
- [ ] Verifica che il footer sia visibile
- [ ] Clicca "Scopri le lezioni" → naviga a `/lezioni`

### 2. Catalogo Lezioni
- [ ] Verifica che le 5 lesson types vengano caricate
- [ ] Verifica che le immagini Unsplash si carichino (3 su 5 hanno immagine)
- [ ] Clicca su una lezione → naviga al dettaglio

### 3. Login Magic Link
- [ ] Clicca "Accedi" → naviga a `/login`
- [ ] Inserisci `admin@demo.local` → invia magic link
- [ ] Controlla email (o Supabase Auth → Users per il link)
- [ ] Clicca il link → verifica redirect e login riuscito

### 4. Prenotazione
- [ ] Da `/lezioni`, seleziona uno slot disponibile
- [ ] Clicca "Prenota" → verifica redirect a `/prenota/:slotId`
- [ ] Completa il form di prenotazione

### 5. Pagamento Stripe (Test Mode)
- [ ] Nel form di pagamento, usa la carta test:
  - Numero: `4242 4242 4242 4242`
  - Scadenza: qualsiasi data futura (es. `12/34`)
  - CVC: qualsiasi 3 cifre (es. `123`)
- [ ] Verifica che il pagamento vada a buon fine
- [ ] Verifica che la booking venga creata con status CONFIRMED

### 6. Portale Cliente
- [ ] Naviga a `/portale`
- [ ] Verifica che la dashboard mostri le prenotazioni
- [ ] Clicca su una prenotazione → verifica il dettaglio

### 7. Admin Dashboard
- [ ] Login con `admin@demo.local`
- [ ] Naviga a `/admin`
- [ ] Verifica KPI cards (prenotazioni, revenue, ecc.)
- [ ] Verifica calendario slot
- [ ] Verifica tabella bookings con filtri

### 8. Email
- [ ] Verifica che l'email di conferma prenotazione sia stata ricevuta
- [ ] (Richiede Resend configurato con dominio verificato)

## Variabili d'Ambiente — Checklist

### Render (Backend)
- [ ] `DATABASE_URL` — Supabase pooler URL
- [ ] `CORS_ORIGIN` — URL Netlify
- [ ] `JWT_SECRET` — stringa random
- [ ] `SUPABASE_URL` — URL progetto Supabase
- [ ] `SUPABASE_JWT_SECRET` — JWT secret da Supabase
- [ ] `STRIPE_SECRET_KEY` — `sk_test_...`
- [ ] `STRIPE_WEBHOOK_SECRET` — `whsec_...`
- [ ] `RESEND_API_KEY` — `re_...`

### Netlify (Frontend)
- [ ] `API_URL` — URL backend Render + `/api`
- [ ] `SUPABASE_URL` — URL progetto Supabase
- [ ] `SUPABASE_ANON_KEY` — anon key pubblica
- [ ] `STRIPE_PUBLIC_KEY` — `pk_test_...`
