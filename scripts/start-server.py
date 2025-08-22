#!/usr/bin/env python3
"""
Serveur web local pour tester l'interface Universal PvP avec Phantom Wallet
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 8080
DIRECTORY = Path(__file__).parent.parent

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Ajouter les headers CORS pour permettre l'accès à Phantom
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

print(f"""
🎮 Universal PvP - Serveur de Test
==================================

📦 Programme déployé: 4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR
🌐 Réseau: Solana Devnet

🚀 Démarrage du serveur sur http://localhost:{PORT}

📝 Instructions:
1. Assurez-vous que Phantom est installé
2. Configurez Phantom sur Devnet (Paramètres → Réseau → Devnet)
3. Obtenez des SOL de test: solana airdrop 2
4. Ouvrez http://localhost:{PORT}/test-interface.html

Appuyez sur Ctrl+C pour arrêter le serveur
""")

# Démarrer le serveur
with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"✅ Serveur actif sur http://localhost:{PORT}")
    print(f"🌐 Ouvrez: http://localhost:{PORT}/test-interface.html")
    
    # Ouvrir automatiquement le navigateur
    try:
        webbrowser.open(f'http://localhost:{PORT}/test-interface.html')
    except:
        pass
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Arrêt du serveur...")
        httpd.shutdown()