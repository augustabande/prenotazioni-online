# Deploy Database — Supabase

## 1. Creare il progetto

1. Vai su [supabase.com](https://supabase.com) → **New Project**
2. Scegli organizzazione, nome progetto (es. `kami-kite`), password DB, regione **EU West (Frankfurt)**
3. Attendi il provisioning (~2 min)

## 2. Copiare le credenziali

Da **Project Settings → Database**:

- **Connection string (Pooler — Transaction mode)**: questa è la `DATABASE_URL`
  - Formato: `postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
  - ⚠️ Usa la **pooler** (porta 6543), NON la direct (porta 5432)
  - ⚠️ Aggiungi `?pgbouncer=true` se non presente

Da **Project Settings → API**:

- **anon public key** → `SUPABASE_ANON_KEY` (frontend)
- **service_role key** → solo backend se necessario (NON esporre mai al frontend)

Da **Project Settings → API → JWT Settings**:

- **JWT Secret** → `SUPABASE_JWT_SECRET` (backend)

## 3. Configurare Auth

1. Vai su **Authentication → Providers**
2. Abilita **Email** provider
3. In **Email → Settings**:
   - ✅ Enable Email OTP (magic link)
   - ❌ Disabilita "Enable email signup" se vuoi solo utenti pre-registrati
4. In **URL Configuration**:
   - Site URL: `https://tuo-sito.netlify.app`
   - Redirect URLs: aggiungi `https://tuo-sito.netlify.app/lezioni`

## 4. Eseguire le migration

```bash
# Imposta DATABASE_URL nel terminale o in backend/.env
export DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Applica le migration
pnpm --filter backend prisma migrate deploy

# Popola i dati demo
pnpm db:seed
```

## 5. Verificare

1. Vai su **Table Editor** in Supabase Dashboard
2. Verifica che le tabelle siano state create (User, Location, LessonType, ecc.)
3. Verifica che i dati seed siano presenti (9 utenti, 30 slot, ecc.)

## Note

- Il piano **Free** di Supabase include 500MB di storage e 2 progetti
- Per produzione reale, considera il piano **Pro** ($25/mese) per backup automatici e più connessioni
- Le migration Prisma usano la connessione diretta internamente; per il runtime dell'app usa sempre il pooler
