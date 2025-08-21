# ⚡ Quick Start - SolDuel Platform

## 🎯 Démarrage en 5 Minutes

### 1️⃣ Installation Rapide
```bash
# Cloner et installer
git clone <repository>
cd platform
npm install
```

### 2️⃣ Lancer le Projet
```bash
npm run dev
# → http://localhost:5173
```

### 3️⃣ C'est Tout! 🎉
Le projet est maintenant accessible sur `http://localhost:5173`

---

## 🗺️ Navigation Rapide

### Où se trouve quoi?
```
platform/
├── 📦 src/         → Code de l'app
├── 🧪 tests/       → Tests
├── 📚 docs/        → Documentation
├── 🚀 programs/    → Smart contracts
└── 📜 scripts/     → Scripts utils
```

### Fichiers Importants
| Fichier | Description |
|---------|-------------|
| `src/features/game-rps/` | Jeu RPS |
| `src/config/constants.ts` | Configuration |
| `docs/DEVELOPER_GUIDE.md` | Guide complet |

---

## 🎮 Tester le Jeu

### 1. Obtenir des SOL de test
```bash
solana airdrop 2 --url devnet
```

### 2. Connecter un Wallet
- Installer [Phantom Wallet](https://phantom.app)
- Basculer sur Devnet
- Connecter sur l'app

### 3. Jouer!
- Créer ou rejoindre un match
- Miser des SOL
- Choisir Rock, Paper ou Scissors
- Gagner! 🏆

---

## 🛠️ Commandes Essentielles

### Développement
```bash
npm run dev          # Serveur de dev
npm run build        # Build production
npm run test         # Tests
```

### Smart Contract
```bash
anchor build         # Compiler
anchor test          # Tester
anchor deploy        # Déployer
```

---

## 📚 Documentation

### Guides Principaux
- 📖 [PROJECT_INDEX.md](./PROJECT_INDEX.md) - Vue d'ensemble complète
- 👨‍💻 [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Guide développeur
- 🏗️ [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - Architecture
- 🔌 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Référence API

### Navigation Structure
- 🗺️ [NAVIGATION.md](../NAVIGATION.md) - Comment naviguer
- 📂 [ORGANISATION_FINALE.md](../ORGANISATION_FINALE.md) - Structure finale

---

## 🚨 Problèmes Courants

### "Cannot connect to wallet"
```bash
# Vérifier que vous êtes sur Devnet
solana config set --url devnet
```

### "Build failed"
```bash
# Nettoyer et réinstaller
rm -rf node_modules
npm install
```

### "Transaction failed"
```bash
# Vérifier le solde
solana balance
# Si vide, airdrop
solana airdrop 2
```

---

## 🎯 Prochaines Étapes

### Pour les Développeurs
1. 📖 Lire [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
2. 🏗️ Explorer l'[architecture](./ARCHITECTURE_OVERVIEW.md)
3. 🧪 Lancer les tests
4. 🎮 Modifier le jeu

### Pour les Utilisateurs
1. 💰 Obtenir des SOL de test
2. 🎮 Jouer quelques parties
3. 🏆 Grimper le leaderboard
4. 💬 Donner du feedback

---

## 💡 Tips & Astuces

### Développement Plus Rapide
```bash
# Ouvrir 2 terminaux
# Terminal 1: Frontend
npm run dev

# Terminal 2: Tests en watch
npm run test:watch
```

### Debug Solana
```bash
# Logs détaillés
export RUST_LOG=solana_runtime::system_instruction_processor=trace
```

### Performance
```bash
# Analyser le bundle
npm run build -- --analyze
```

---

## 📞 Aide & Support

### Ressources
- 📚 [Documentation complète](./PROJECT_INDEX.md)
- 💬 Discord communautaire
- 🐛 [Issues GitHub](https://github.com/...)

### Commandes d'Aide
```bash
# Voir toutes les commandes
npm run

# Aide Anchor
anchor --help

# Aide Solana
solana --help
```

---

## 🚀 Ready to Build?

```bash
# Tout est prêt! Commencez par:
npm run dev

# Et ouvrez:
http://localhost:5173
```

**Bon développement! 🎉**

---

*💡 Astuce: Gardez cette page ouverte pour référence rapide!*

*📚 Pour plus de détails, consultez le [Guide du Développeur](./DEVELOPER_GUIDE.md)*