#!/bin/bash

# Deploy SolDuel to GitHub Pages

echo "🚀 Deploying SolDuel to GitHub Pages..."

# Copy demo file to index.html
cp solduel-demo.html index.html

# Initialize git if needed
if [ ! -d .git ]; then
    git init
    git remote add origin https://github.com/YOUR_USERNAME/solduel-rps.git
fi

# Create gh-pages branch
git checkout -b gh-pages 2>/dev/null || git checkout gh-pages

# Add files
git add index.html
git add public/
git commit -m "Deploy SolDuel RPS demo to GitHub Pages"

# Push to GitHub
echo "📦 Ready to push to GitHub Pages"
echo "Run: git push origin gh-pages --force"
echo "Then visit: https://YOUR_USERNAME.github.io/solduel-rps/"
echo ""
echo "🎮 Program ID: 4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR"
echo "🌐 Network: Solana Devnet"
echo "💰 Fees: 0% - Winner takes all!"