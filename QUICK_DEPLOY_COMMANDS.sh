#!/bin/bash

# 🚀 SCRIPT DE DÉPLOIEMENT RAPIDE DEVNET - Universal PvP
# Usage: chmod +x QUICK_DEPLOY_COMMANDS.sh && ./QUICK_DEPLOY_COMMANDS.sh

echo "🎮 Universal PvP - Déploiement Devnet"
echo "======================================"

# 1. Configuration Solana CLI
echo "📍 Step 1: Configuration Solana pour Devnet..."
solana config set --url devnet

# 2. Vérifier/Créer wallet
if [ ! -f ~/.config/solana/devnet-deployer.json ]; then
    echo "🔑 Step 2: Création d'un nouveau wallet Devnet..."
    solana-keygen new --outfile ~/.config/solana/devnet-deployer.json --no-bip39-passphrase
fi

echo "💰 Step 3: Configuration du wallet..."
solana config set --keypair ~/.config/solana/devnet-deployer.json

# 3. Obtenir des SOL de test
echo "💸 Step 4: Obtention de SOL de test (5 SOL)..."
solana airdrop 2
sleep 5
solana airdrop 2
sleep 5
solana airdrop 1

echo "💳 Balance actuelle:"
solana balance

# 4. Build du programme
echo "🔨 Step 5: Build du programme Anchor..."
cd /Users/simeonfluck/teste\ 3/platform
anchor build

# 5. Déploiement sur Devnet
echo "🚀 Step 6: Déploiement sur Devnet..."
anchor deploy --provider.cluster devnet

# 6. Récupérer le Program ID
echo "📝 Step 7: Récupération du Program ID..."
PROGRAM_ID=$(solana program show --programs | grep "Program Id" | head -1 | awk '{print $3}')
echo "✅ Program ID: $PROGRAM_ID"

# 7. Mettre à jour les fichiers de configuration
echo "⚙️ Step 8: Mise à jour des configurations..."

# Mettre à jour Anchor.toml
sed -i.bak "s/universal_pvp = \".*\"/universal_pvp = \"$PROGRAM_ID\"/" Anchor.toml

# Créer/Mettre à jour le fichier de constantes frontend
cat > src/constants.ts << EOF
// Configuration Universal PvP - Devnet
export const NETWORK = 'devnet';
export const PROGRAM_ID = '$PROGRAM_ID';
export const RPC_URL = 'https://api.devnet.solana.com';
export const COMMITMENT = 'confirmed';

// Configuration du jeu
export const MIN_BET = 0.05; // 0.05 SOL minimum
export const MAX_BET = 10;   // 10 SOL maximum
export const DEFAULT_BET = 0.1; // 0.1 SOL par défaut

// Features
export const FEATURES = {
  ZERO_FEES: true,
  MULTI_ROUNDS: true,
  DISPUTE_SYSTEM: true,
  TIMEOUT_SECONDS: 60,
};

// Messages
export const MESSAGES = {
  NETWORK_NAME: '🔧 DEVNET (Test Network)',
  ZERO_FEES: '🎉 0% FEES - 100% to Winners!',
  GET_TEST_SOL: 'Get test SOL from faucet.solana.com',
};
EOF

# 8. Copier l'IDL pour le frontend
echo "📋 Step 9: Copie de l'IDL..."
mkdir -p src/idl
cp target/idl/universal_pvp.json src/idl/

# 9. Installer les dépendances frontend
echo "📦 Step 10: Installation des dépendances..."
npm install

# 10. Créer le fichier .env pour le frontend
cat > .env << EOF
VITE_SOLANA_NETWORK=devnet
VITE_PROGRAM_ID=$PROGRAM_ID
VITE_RPC_URL=https://api.devnet.solana.com
EOF

# 11. Build du frontend
echo "🎨 Step 11: Build du frontend..."
npm run build

# 12. Afficher les résultats
echo ""
echo "✅ ========================================="
echo "✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!"
echo "✅ ========================================="
echo ""
echo "📊 INFORMATIONS DE DÉPLOIEMENT:"
echo "--------------------------------"
echo "🔑 Program ID: $PROGRAM_ID"
echo "🌐 Network: Devnet"
echo "💰 Wallet: $(solana address)"
echo "💵 Balance: $(solana balance)"
echo ""
echo "🎮 PROCHAINES ÉTAPES:"
echo "--------------------------------"
echo "1. Tester localement: npm run dev"
echo "2. Déployer sur Vercel:"
echo "   - npm install -g vercel"
echo "   - vercel --prod"
echo ""
echo "3. Ou déployer sur Netlify:"
echo "   - npm install -g netlify-cli"
echo "   - netlify deploy --prod --dir=dist"
echo ""
echo "📱 POUR TESTER:"
echo "--------------------------------"
echo "1. Ouvre Phantom/Solflare"
echo "2. Change le réseau vers Devnet"
echo "3. Va sur https://faucet.solana.com pour obtenir des SOL de test"
echo "4. Connecte-toi à l'app et joue!"
echo ""
echo "🎉 Universal PvP - 0% Fees Gaming Platform"
echo "🚀 Ready for testing on Devnet!"