const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Activer CORS pour Phantom Wallet
app.use(cors());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '..')));

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'test-interface.html'));
});

// API endpoint pour info (optionnel)
app.get('/api/program-info', (req, res) => {
    res.json({
        programId: '4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR',
        network: 'devnet',
        status: 'deployed',
        explorer: 'https://explorer.solana.com/address/4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR?cluster=devnet'
    });
});

app.listen(PORT, () => {
    console.log(`
🎮 Universal PvP - Serveur de Test
==================================

📦 Programme: 4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR
🌐 Réseau: Solana Devnet

✅ Serveur démarré sur http://localhost:${PORT}

📝 Instructions:
1. Configurez Phantom sur Devnet
2. Ouvrez http://localhost:${PORT} dans votre navigateur
3. Connectez votre wallet et testez!

Ctrl+C pour arrêter
    `);
    
    // Ouvrir le navigateur automatiquement
    const { exec } = require('child_process');
    exec(`open http://localhost:${PORT}`);
});