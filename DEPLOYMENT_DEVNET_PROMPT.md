# 🚀 PROMPT DE DÉPLOIEMENT DEVNET - Universal PvP Platform

## 📋 Contexte pour Claude

Je veux déployer mon programme Solana Universal PvP sur Devnet et avoir une interface web fonctionnelle pour tester directement dans le navigateur. Le programme est 100% complété avec toutes les instructions implémentées.

## 🎯 Objectifs

1. **Déployer le smart contract sur Devnet**
2. **Adapter le frontend pour Devnet**
3. **Configurer l'interface pour être testable immédiatement**
4. **Fournir un lien de test accessible dans le navigateur**

## 📁 Structure du Projet

```
/Users/simeonfluck/teste 3/platform/
├── programs/universal_pvp/       # Smart contract Rust (100% complété)
├── src/                          # Frontend React/TypeScript
├── tests/                        # Tests Anchor
├── Anchor.toml                   # Configuration Anchor
└── package.json                  # Dependencies
```

## 🔧 État Actuel

- **Smart Contract** : ✅ 100% complété, compile avec succès
- **Instructions** : Toutes implémentées (create, join, settle, claim, cancel, dispute)
- **Frontend** : Existe mais doit être adapté pour Devnet
- **Tests** : Suite complète créée

## 📝 PROMPT POUR CLAUDE (Copier-coller dans une nouvelle conversation)

---

**DÉBUT DU PROMPT**

Bonjour ! J'ai un programme Solana Universal PvP (plateforme de jeux PvP avec 0% de frais) qui est prêt à être déployé sur Devnet. J'ai besoin de ton aide avec le swarm d'agents pour :

### 1. DÉPLOIEMENT SMART CONTRACT

Déploie le programme sur Solana Devnet en utilisant ces étapes :
- Vérifier/créer un wallet Solana avec des SOL de Devnet
- Builder le programme avec `anchor build`
- Déployer sur Devnet avec `anchor deploy --provider.cluster devnet`
- Noter le Program ID généré
- Mettre à jour tous les fichiers nécessaires avec le nouveau Program ID

### 2. ADAPTATION FRONTEND

Le frontend React doit être configuré pour :
- Se connecter à Devnet (pas localhost)
- Utiliser le nouveau Program ID de Devnet
- Avoir les bonnes configurations RPC
- Supporter Phantom/Solflare wallets sur Devnet
- Afficher clairement qu'on est sur Devnet

Fichiers clés à adapter :
- `/src/constants.ts` - Program ID et configuration réseau
- `/src/contexts/AnchorProvider.tsx` - Configuration du provider
- `/src/hooks/useProgram.ts` - Connection au programme
- `/src/components/WalletButton.tsx` - Configuration wallet

### 3. FEATURES À IMPLÉMENTER/VÉRIFIER

L'interface doit permettre de :
- Créer un match RPS avec mise en SOL
- Rejoindre un match existant
- Jouer (Pierre/Papier/Ciseaux)
- Voir le résultat et réclamer les gains
- Système multi-rounds (Best of 3/5/7)
- Afficher "0% FEES" clairement

### 4. DÉPLOIEMENT WEB

Configure le projet pour être accessible dans le navigateur :
- Build de production optimisé
- Utiliser Vercel, Netlify ou GitHub Pages
- Variables d'environnement pour Devnet
- CORS et sécurité configurés

### 5. INFORMATIONS PROJET

- **Chemin** : `/Users/simeonfluck/teste 3/platform/`
- **Programme** : `programs/universal_pvp/src/lib.rs`
- **Frontend** : React + TypeScript + Vite
- **Features** : 0% frais, multi-jeux, multi-rounds
- **Premier jeu** : Rock Paper Scissors (RPS)

### COMMANDES À UTILISER

```bash
# 1. Configuration wallet
solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/devnet.json
solana airdrop 2

# 2. Build et déploiement
cd /Users/simeonfluck/teste\ 3/platform
anchor build
anchor deploy --provider.cluster devnet

# 3. Frontend
npm install
npm run dev  # Pour test local
npm run build  # Pour production

# 4. Déploiement web (exemple Vercel)
npm install -g vercel
vercel --prod
```

### UTILISE LE SWARM D'AGENTS

Active le swarm d'agents Claude Flow pour coordonner toutes ces tâches :
- Agent `backend-dev` pour le déploiement Solana
- Agent `frontend` pour l'adaptation de l'interface
- Agent `tester` pour valider que tout fonctionne
- Agent `devops` pour le déploiement web

Le programme doit être testable immédiatement après déploiement avec une URL publique.

**IMPORTANT** : 
- Le smart contract est DÉJÀ complété à 100%, ne pas le modifier
- Focus sur le déploiement et l'adaptation frontend
- L'objectif est d'avoir une démo fonctionnelle sur Devnet AUJOURD'HUI

Peux-tu utiliser le swarm d'agents pour accomplir tout cela et me fournir un lien où je peux tester le jeu directement ?

**FIN DU PROMPT**

---

## 🎯 Résultats Attendus

Après avoir utilisé ce prompt, tu devrais obtenir :

1. **Program ID Devnet** : L'adresse du programme déployé
2. **URL de test** : Un lien public (ex: https://ton-projet.vercel.app)
3. **Instructions de test** : Comment tester avec un wallet Phantom/Solflare
4. **Confirmation** : Que le système 0% frais fonctionne

## 💡 Tips Supplémentaires

### Pour le Wallet de Test
```bash
# Si tu n'as pas de wallet Devnet
solana-keygen new --outfile ~/.config/solana/devnet-deployer.json
solana config set --keypair ~/.config/solana/devnet-deployer.json
solana airdrop 5  # Obtenir 5 SOL de test
```

### Variables d'Environnement Frontend
```env
VITE_SOLANA_NETWORK=devnet
VITE_PROGRAM_ID=[TON_PROGRAM_ID_DEVNET]
VITE_RPC_URL=https://api.devnet.solana.com
```

### Structure IDL
Après déploiement, l'IDL sera dans :
```
target/idl/universal_pvp.json
```
Copie-le dans `src/idl/` du frontend.

## 🚨 Points d'Attention

1. **Faucet Devnet** : Si `solana airdrop` échoue, utilise https://faucet.solana.com
2. **RPC Limits** : Utilise un RPC personnalisé si nécessaire (Helius, QuickNode)
3. **Program Size** : Si trop gros, optimise avec `[profile.release]` dans Cargo.toml
4. **CORS** : Configure correctement pour l'accès depuis le navigateur

## 📊 Checklist de Validation

- [ ] Programme déployé sur Devnet
- [ ] Program ID mis à jour partout
- [ ] Frontend connecté à Devnet
- [ ] Wallet connection fonctionne
- [ ] Création de match fonctionne
- [ ] Gameplay RPS fonctionne
- [ ] 0% de frais vérifié
- [ ] URL publique accessible
- [ ] Instructions claires fournies

## 🎮 Test Final

1. Ouvre l'URL publique
2. Connecte Phantom sur Devnet
3. Obtiens des SOL de test (faucet)
4. Crée un match avec 0.1 SOL
5. Rejoins avec un autre wallet
6. Joue Pierre/Papier/Ciseaux
7. Vérifie que le gagnant reçoit 0.2 SOL (100% du pot)

---

**Bonne chance pour le déploiement ! 🚀**

*Ce prompt a été optimisé pour utiliser le swarm d'agents Claude Flow et obtenir un résultat rapide et fonctionnel.*