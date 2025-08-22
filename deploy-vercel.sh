#!/bin/bash

echo "🚀 Déploiement SolDuel sur Vercel..."

# Backup du package.json actuel
cp package.json package-backup.json

# Utiliser le package minimal pour Vercel
cp package-minimal.json package.json

# Nettoyer les anciens modules
rm -rf node_modules package-lock.json yarn.lock pnpm-lock.yaml

# Installer Vercel CLI si nécessaire
which vercel > /dev/null || npm install -g vercel

echo "📦 Configuration pour Vercel..."

# Créer un build simplifié si le full build échoue
cat > build-fallback.sh << 'EOF'
#!/bin/bash
echo "Build fallback activé..."
mkdir -p dist
cp index.html dist/
cp -r public dist/ 2>/dev/null || true
echo "Build fallback terminé!"
EOF

chmod +x build-fallback.sh

echo "🌐 Lancement du déploiement..."
echo ""
echo "INSTRUCTIONS:"
echo "1. Exécutez: vercel --prod"
echo "2. Suivez les instructions"
echo "3. Choisissez 'Create a new project'"
echo "4. Utilisez les paramètres par défaut"
echo ""
echo "Variables d'environnement déjà configurées dans vercel.json:"
echo "- VITE_RPC_ENDPOINT=https://api.devnet.solana.com"
echo "- VITE_PROGRAM_ID=4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR"
echo ""
echo "🎮 Votre jeu sera accessible sur l'URL fournie par Vercel!"