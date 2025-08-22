#!/bin/bash

echo "🏗️ Build simplifié pour déploiement rapide..."

# Créer le dossier dist
mkdir -p dist

# Copier le HTML statique
cp index.html dist/index.html

# Copier les assets publics
cp -r public/* dist/ 2>/dev/null || true

# Créer un fichier de configuration pour Vercel
cat > dist/vercel.json << EOF
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
EOF

echo "✅ Build simplifié terminé!"
echo "📁 Contenu dans le dossier: dist/"
echo ""
echo "Pour déployer:"
echo "1. cd dist"
echo "2. npx vercel --prod"
echo ""
echo "Ou utilisez drag & drop sur vercel.com"