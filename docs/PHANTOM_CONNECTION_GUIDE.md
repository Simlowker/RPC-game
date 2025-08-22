# 🔌 Guide de Connexion Phantom Wallet

## ⚠️ Problème: "Phantom wallet non détecté"

Ce message apparaît quand vous ouvrez `test-interface.html` directement dans le navigateur. C'est une restriction de sécurité des navigateurs pour les fichiers locaux.

## ✅ Solutions

### Solution 1: Serveur Python (Recommandé - Rapide)
```bash
# Lancez le serveur Python inclus
python3 scripts/start-server.py

# Ou directement:
cd /Users/simeonfluck/teste\ 3/platform
python3 -m http.server 8080

# Puis ouvrez: http://localhost:8080/test-interface.html
```

### Solution 2: Serveur Node.js
```bash
# Installez les dépendances si nécessaire
npm install express cors

# Lancez le serveur
node scripts/server.js

# Automatiquement ouvert sur: http://localhost:8080
```

### Solution 3: Live Server VS Code
Si vous utilisez VS Code:
1. Installez l'extension "Live Server"
2. Clic droit sur `test-interface.html`
3. Sélectionnez "Open with Live Server"

### Solution 4: Serveur Simple avec NPX
```bash
# Sans rien installer
npx http-server . -p 8080

# Ouvrez: http://localhost:8080/test-interface.html
```

## 🔧 Configuration Phantom

### 1. Vérifier l'Installation
- Phantom doit être installé: https://phantom.app
- Vérifiez qu'il apparaît dans les extensions de votre navigateur

### 2. Configurer sur Devnet
1. Ouvrez Phantom
2. Cliquez sur l'icône ⚙️ (Paramètres)
3. Allez dans "Developer Settings"
4. Changez "Network" pour **Devnet**

### 3. Obtenir des SOL de Test
```bash
# Dans le terminal
solana airdrop 2 YOUR_WALLET_ADDRESS

# Ou dans Phantom sur Devnet
# Les SOL de test sont gratuits
```

## 🎯 Test Rapide

### Étape 1: Lancer le Serveur
```bash
# Option la plus simple
python3 scripts/start-server.py
```

### Étape 2: Vérifier Phantom
- L'icône Phantom doit être visible dans votre navigateur
- Vous devez être sur le réseau **Devnet**

### Étape 3: Connecter
1. Allez sur http://localhost:8080/test-interface.html
2. Cliquez sur "Connecter Phantom Wallet"
3. Approuvez dans Phantom

## 🐛 Dépannage

### Phantom n'apparaît pas
- **Chrome**: chrome://extensions/ → Vérifiez que Phantom est activé
- **Firefox**: about:addons → Vérifiez Phantom
- **Safari**: Préférences → Extensions → Activez Phantom

### "window.solana is undefined"
- Rafraîchissez la page (F5)
- Vérifiez que vous utilisez http://localhost et non file://
- Redémarrez le navigateur

### Connexion refusée
- Vérifiez que vous êtes sur Devnet dans Phantom
- Déconnectez et reconnectez Phantom
- Essayez un autre navigateur

## 📱 Alternatives Sans Serveur

### Utiliser les Scripts de Test Directement
```bash
# Tests complets sans interface
anchor test --skip-local-validator

# Ou avec npm
npm test
```

### Utiliser Solana CLI
```bash
# Vérifier le programme
solana program show 4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR

# Voir les logs
solana logs 4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR
```

## 🚀 Commande Rapide

```bash
# Copier-coller pour démarrer rapidement:
cd /Users/simeonfluck/teste\ 3/platform && python3 -m http.server 8080 &
open http://localhost:8080/test-interface.html
```

---

**Note**: Le serveur local est nécessaire uniquement pour l'interface web. Les tests Anchor fonctionnent directement sans serveur.