# 🚀 Guide de Déploiement SolDuel sur Vercel

## ✅ Statut Actuel

- **Smart Contract**: Déployé sur Devnet ✅
- **Program ID**: `4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR`
- **Frontend**: Prêt à déployer ✅
- **Demo Locale**: http://localhost:8888 ✅

## 📦 Fichiers Préparés

Tous les fichiers nécessaires sont prêts :

1. **`dist/`** - Dossier avec le build statique
2. **`vercel.json`** - Configuration Vercel
3. **`.env`** - Variables d'environnement
4. **`package-minimal.json`** - Dependencies minimales
5. **`index.html`** - Interface complète

## 🎯 Option 1: Déploiement Simple (Recommandé)

### Via l'interface Vercel.com

1. **Allez sur [vercel.com](https://vercel.com)**
2. **Connectez-vous** avec GitHub/GitLab/Email
3. **Cliquez sur "Add New Project"**
4. **Choisissez "Import Third-Party Git Repository"**
5. **OU utilisez "Upload Folder"** et glissez le dossier `dist/`

### Configuration :
- **Framework Preset**: Other
- **Build Command**: (laisser vide)
- **Output Directory**: ./
- **Install Command**: (laisser vide)

### Variables d'environnement (déjà dans vercel.json) :
```
VITE_RPC_ENDPOINT=https://api.devnet.solana.com
VITE_PROGRAM_ID=4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR
VITE_NETWORK=devnet
```

## 🎯 Option 2: Via CLI

```bash
# Dans le dossier dist/
cd dist/

# Déployer
npx vercel --prod

# Suivre les instructions
# - Choisir "N" pour link to existing project
# - Donner un nom au projet
# - Laisser les paramètres par défaut
```

## 🎯 Option 3: GitHub + Vercel

1. **Push sur GitHub** :
```bash
git init
git add .
git commit -m "SolDuel RPS - 0% fees platform"
git remote add origin https://github.com/[username]/solduel-rps.git
git push -u origin main
```

2. **Sur Vercel** :
- Import from GitHub
- Sélectionner le repo
- Deploy

## 🔧 Résolution des Problèmes

### Erreur 401 sur Vercel

Si vous avez une erreur 401, c'est que le projet n'est pas public :

1. Allez dans **Project Settings** sur Vercel
2. Cherchez **"Password Protection"** ou **"Authentication"**
3. Désactivez la protection par mot de passe
4. Redéployez

### Alternative : Utiliser le HTML statique

Le fichier `index.html` fonctionne partout :
- GitHub Pages
- Netlify (drag & drop)
- Surge.sh (`npx surge dist/`)
- Firebase Hosting
- AWS S3 + CloudFront

## 📱 Test de la Demo

Une fois déployé :

1. **Ouvrez l'URL fournie** par Vercel
2. **Installez Phantom Wallet**
3. **Passez sur Devnet** dans Phantom
4. **Obtenez des SOL de test** : https://faucet.solana.com
5. **Connectez votre wallet**
6. **Créez un match** avec 0% de frais !

## 🎮 Fonctionnalités Disponibles

- ✅ Connection wallet Phantom
- ✅ Affichage balance SOL
- ✅ Création de match (demo)
- ✅ Interface Rock Paper Scissors
- ✅ 0% de frais - Winner takes all
- ✅ Program ID Devnet configuré

## 🚨 Notes Importantes

1. **C'est sur DEVNET** - Utilisez uniquement des SOL de test
2. **Program ID**: `4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR`
3. **RPC Endpoint**: https://api.devnet.solana.com
4. **Wallet**: Phantom ou Solflare sur Devnet

## 💡 Commandes Utiles

```bash
# Test local
python3 -m http.server 8888

# Build simple
./build-simple.sh

# Deploy Vercel
cd dist && npx vercel --prod

# Deploy Surge
npx surge dist/

# Deploy Netlify (drag & drop)
open https://app.netlify.com/drop
```

## ✅ Checklist Finale

- [x] Smart contract déployé sur Devnet
- [x] Frontend avec Program ID correct
- [x] Configuration Devnet
- [x] Interface 0% fees
- [x] Build dans dist/
- [x] Prêt pour Vercel/Netlify/GitHub Pages
- [ ] Déployer et obtenir URL publique
- [ ] Tester avec Phantom sur Devnet

## 🎯 URL de Production

Une fois déployé, votre jeu sera accessible à :
- **Vercel**: https://[votre-projet].vercel.app
- **Netlify**: https://[votre-projet].netlify.app
- **GitHub Pages**: https://[username].github.io/solduel-rps

---

**Le jeu est PRÊT ! Il suffit de le déployer sur une des plateformes ci-dessus.** 🚀