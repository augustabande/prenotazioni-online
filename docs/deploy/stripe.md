# Deploy Stripe Webhook

## 1. Creare l'endpoint webhook

1. Vai su [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Clicca **Add endpoint**
3. Configura:
   - **Endpoint URL**: `https://kite-booking-api.onrender.com/api/payments/webhook`
   - **Events to send**: seleziona:
     - `payment_intent.succeeded`
     - `payment_intent.canceled`
     - `payment_intent.payment_failed`
     - `charge.refunded`
4. Clicca **Add endpoint**

## 2. Copiare il Signing Secret

1. Nella pagina del webhook appena creato, clicca **Reveal** sotto **Signing secret**
2. Copia il valore `whsec_...`
3. Aggiungilo come env var `STRIPE_WEBHOOK_SECRET` su Render

## 3. Verificare

1. Nella pagina del webhook su Stripe, clicca **Send test webhook**
2. Seleziona `payment_intent.succeeded` → **Send**
3. Verifica che lo status sia `200` nella lista degli eventi

## 4. Chiavi API

Assicurati di avere configurato su Render:

| Variabile | Dove trovarla |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → Secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → Signing secret (`whsec_...`) |

E nel frontend su Netlify:

| Variabile | Dove trovarla |
|---|---|
| `STRIPE_PUBLIC_KEY` | Stripe Dashboard → Developers → API keys → Publishable key (`pk_test_...`) |

## 5. Test mode vs Live mode

- Per la demo, usa le chiavi **test mode** (prefisso `sk_test_` / `pk_test_`)
- Carta di test: `4242 4242 4242 4242`, scadenza futura qualsiasi, CVC qualsiasi
- Per andare in produzione: attiva l'account Stripe, sostituisci le chiavi con quelle live, ricrea il webhook endpoint in live mode

## Note

- Il backend usa `rawBody: true` in NestFactory per ricevere il body non parsato, necessario per la verifica della firma Stripe
- L'endpoint `/api/payments/webhook` NON richiede autenticazione JWT (è chiamato da Stripe)
- In caso di errori 400, verifica che `STRIPE_WEBHOOK_SECRET` corrisponda all'endpoint corretto
