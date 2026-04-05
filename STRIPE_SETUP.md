# Configuration Stripe + Supabase + Vercel

## 1) Créer le compte Stripe
- Ouvre le dashboard Stripe et active le mode test.
- Crée un produit Premium.
- Crée un prix récurrent mensuel pour ce produit.

## 2) Récupérer les clés
Dans Stripe > Developers > API keys :
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY` (facultative dans cette version car Checkout est lancé depuis le serveur)

Dans le produit/prix Stripe :
- copie le `price_id` et mets-le dans `STRIPE_PRICE_ID`

## 3) Configurer les variables sur Vercel
Ajoute dans Vercel > Settings > Environment Variables :
- `NEXT_PUBLIC_SITE_URL=https://ton-site.vercel.app`
- `STRIPE_SECRET_KEY=sk_test_...`
- `STRIPE_PRICE_ID=price_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`

## 4) Configurer le webhook Stripe
Dans Stripe > Developers > Webhooks :
- ajoute l’endpoint `https://ton-site.vercel.app/api/stripe/webhook`
- écoute au minimum :
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- copie le secret du webhook dans `STRIPE_WEBHOOK_SECRET`

## 5) Tester le flow complet
1. Connecte-toi sur le site
2. Va sur `/premium/success`
3. Clique “Devenir Premium”
4. Utilise une carte de test Stripe
5. Vérifie dans Supabase que `profiles.is_premium = true`
6. Retourne sur le forum pour tester l’envoi vocal

## 6) Buckets Supabase
Exécute `supabase_schema.sql` pour créer/mettre à jour :
- le bucket `avatars`
- le bucket privé `voice-messages`
- les policies Storage

## 7) Redirects Supabase Auth
Dans Supabase > Authentication > URL Configuration, ajoute :
- `https://ton-site.vercel.app`
- `https://ton-site.vercel.app/*`
- `http://localhost:3000`
