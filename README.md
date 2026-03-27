# BAC Mali — Site de vérification des résultats

Site web pour permettre aux étudiants maliens de vérifier leurs résultats du Baccalauréat.

## Stack technique
- **Next.js 14** — Framework web (hébergé sur Vercel)
- **Supabase** — Base de données PostgreSQL
- **Vercel** — Hébergement gratuit

---

## Déploiement en 3 étapes

### Étape 1 — Préparer GitHub

1. Va sur **github.com** → crée un compte gratuit
2. Clique **"+ New repository"**
3. Nom du repo : `bac-mali`
4. Laisse-le public → clique **"Create repository"**
5. Sur la page du repo, clique **"uploading an existing file"**
6. Glisse-dépose TOUS les fichiers de ce dossier (structure à respecter)
7. Clique **"Commit changes"**

### Étape 2 — Connecter Vercel

1. Va sur **vercel.com** → connecte-toi avec GitHub
2. Clique **"Add New → Project"**
3. Sélectionne le repo `bac-mali`
4. Dans **"Environment Variables"**, ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL` → l'URL de ton projet Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → la clé anon public de Supabase
5. Clique **"Deploy"** → attends 2 minutes
6. Ton site est en ligne sur `bac-mali.vercel.app` !

### Étape 3 — Ajouter un domaine personnalisé (optionnel)

Dans Vercel → Project → Settings → Domains → ajoute ton domaine.

---

## Développement local

```bash
# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.local.example .env.local
# → Remplis les valeurs Supabase dans .env.local

# Lancer en local
npm run dev
# → Ouvre http://localhost:3000
```

---

## Ajouter une nouvelle année

1. Lance le script Python `extraire_bac_mali.py` sur le nouveau PDF
2. Change `ANNEE`, `CENTRE` et `PDF_PATH` en haut du script
3. Lance : `python3 extraire_bac_mali.py`
4. Importe le CSV généré dans Supabase → Table Editor → Import data from CSV

Le site affiche automatiquement la nouvelle année dans le menu déroulant.

---

## Structure des fichiers

```
bac-mali/
├── app/
│   ├── layout.js          ← Métadonnées (titre, description)
│   ├── page.js            ← Page principale (UI + formulaire)
│   ├── globals.css        ← Styles globaux
│   └── api/
│       └── recherche/
│           └── route.js   ← API sécurisée (requêtes Supabase)
├── lib/
│   └── supabase.js        ← Client Supabase
├── package.json
├── next.config.mjs
└── .env.local.example     ← Template des variables d'environnement
```

---

## Sécurité

- Les données sensibles (date de naissance, lieu, établissement) ne sont **jamais** retournées à l'utilisateur
- Seuls nom, prénom, série, mention et statut sont affichés
- La clé `anon` Supabase est publique mais les requêtes sont filtrées côté serveur
- Aucune donnée n'est stockée dans le navigateur

## Monétisation future

Pour ajouter Google AdSense :
1. Crée un compte AdSense sur `adsense.google.com`
2. Ajoute le script AdSense dans `app/layout.js`
3. Place les unités publicitaires dans `app/page.js`
