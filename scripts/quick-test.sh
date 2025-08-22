#!/bin/bash

echo "🎮 Universal PvP - Test Rapide"
echo "=============================="
echo ""
echo "Program ID: 4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR"
echo "Network: Devnet"
echo ""

# Configuration
PROGRAM_ID="4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR"

# Vérifier le statut du programme
echo "📊 Vérification du programme déployé..."
solana program show $PROGRAM_ID

echo ""
echo "🔍 Affichage des comptes du programme..."
# Essayer de lire les comptes associés au programme
solana account -u devnet $(solana address -k ~/.config/solana/devnet-keypair.json) --output json

echo ""
echo "💰 Votre solde actuel:"
solana balance

echo ""
echo "📝 Logs du programme (dernières transactions):"
echo "Pour voir les logs en temps réel, exécutez:"
echo "  solana logs $PROGRAM_ID"
echo ""

echo "🎯 Pour tester via Anchor:"
echo "  1. anchor test --skip-local-validator"
echo ""
echo "🌐 Explorer:"
echo "  https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo ""

echo "✅ Programme prêt à être testé!"