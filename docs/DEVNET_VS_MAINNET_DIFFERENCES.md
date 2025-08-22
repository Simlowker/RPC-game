# 🎮 SolDuel Universal PvP - Différences entre Devnet et Mainnet

## 📊 Résumé des Différences Principales

### 1. **Configuration Réseau**

| Aspect | Devnet | Mainnet |
|--------|--------|---------|
| **RPC Endpoint** | `https://api.devnet.solana.com` | `https://api.mainnet-beta.solana.com` |
| **Cluster** | `devnet` | `mainnet-beta` |
| **Explorer** | `explorer.solana.com?cluster=devnet` | `explorer.solana.com` |
| **Fiabilité** | Peut être instable, resets fréquents | Haute disponibilité, stable |
| **Vitesse** | Variable, parfois lent | Optimisé pour la performance |

### 2. **Coûts et Économie**

| Aspect | Devnet | Mainnet |
|--------|--------|---------|
| **SOL pour déploiement** | Gratuit (airdrop) | ~2 SOL réels |
| **Frais de transaction** | Gratuit (airdrop) | ~0.00025 SOL par tx |
| **Valeur des SOL** | Aucune valeur réelle | Valeur monétaire réelle |
| **Airdrop disponible** | ✅ Oui (2 SOL max) | ❌ Non |
| **Coût de stockage** | Gratuit | ~0.00204928 SOL par KB |

### 3. **Sécurité et Risques**

| Aspect | Devnet | Mainnet |
|--------|--------|---------|
| **Risque financier** | Aucun | Élevé (argent réel) |
| **Audit requis** | Optionnel | **OBLIGATOIRE** |
| **Tests requis** | Basiques | Exhaustifs |
| **Backup wallet** | Optionnel | **CRITIQUE** |
| **Multisig** | Optionnel | Fortement recommandé |
| **Monitoring** | Basique | 24/7 obligatoire |

### 4. **Configuration Programme**

#### **Devnet Configuration:**
```toml
[programs.devnet]
universal_pvp = "3JnwSvryNp7DX75YKmCdzsVARDU1TBm1zDCntoTVJ49H"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```

#### **Mainnet Configuration:**
```toml
[programs.mainnet]
universal_pvp = "3JnwSvryNp7DX75YKmCdzsVARDU1TBm1zDCntoTVJ49H"

[provider]
cluster = "mainnet-beta"
wallet = "~/.config/solana/mainnet-keypair.json"  # Wallet séparé recommandé
```

### 5. **Optimisations Cargo.toml**

Le programme est déjà configuré avec les optimisations mainnet:
```toml
[profile.release]
opt-level = "z"          # Optimisation taille (important pour les coûts)
lto = true               # Link Time Optimization
codegen-units = 1        # Meilleure optimisation
strip = true             # Retrait symboles debug
overflow-checks = true   # Sécurité maintenue
```

## 🔐 Changements Nécessaires pour Mainnet

### 1. **Avant le Déploiement**

#### ✅ **Tests Obligatoires**
- [ ] Tous les tests unitaires passent
- [ ] Tests d'intégration complets
- [ ] Tests de charge et performance
- [ ] Simulation de scénarios d'attaque
- [ ] Tests de récupération après erreur

#### 🔒 **Sécurité**
- [ ] Audit de sécurité professionnel
- [ ] Vérification des overflow/underflow
- [ ] Protection contre les reentrancy attacks
- [ ] Validation de toutes les entrées utilisateur
- [ ] Pas de clés privées dans le code

#### 💰 **Préparation Financière**
- [ ] Wallet avec minimum 3 SOL
- [ ] Backup du wallet en lieu sûr
- [ ] Configuration multisig si possible
- [ ] Budget pour les frais de transaction

### 2. **Configuration Environnement**

#### **Variables d'Environnement (.env.production)**
```bash
# Mainnet Configuration
VITE_NETWORK=mainnet-beta
VITE_RPC_URL=https://api.mainnet-beta.solana.com  # Ou RPC premium
VITE_PROGRAM_ID=YOUR_MAINNET_PROGRAM_ID
VITE_COMMITMENT_LEVEL=finalized  # Plus strict que devnet

# Sécurité
ENABLE_DEBUG=false
LOG_LEVEL=error
RATE_LIMIT=strict

# Monitoring
SENTRY_DSN=your_sentry_dsn
MONITORING_ENABLED=true
```

### 3. **RPC Endpoints**

#### **Devnet** (Gratuit)
```javascript
const connection = new Connection('https://api.devnet.solana.com');
```

#### **Mainnet** (Recommandé: RPC Premium)
```javascript
// Option 1: RPC public (limité)
const connection = new Connection('https://api.mainnet-beta.solana.com');

// Option 2: RPC Premium (recommandé pour production)
const connection = new Connection('https://your-provider.solana-mainnet.quiknode.pro/YOUR_KEY/');
// Providers: QuickNode, Alchemy, Helius, Triton
```

### 4. **Gestion des Erreurs**

#### **Devnet**
```rust
// Erreurs peuvent être ignorées pour tests
msg!("Error occurred: {:?}", error);
```

#### **Mainnet**
```rust
// Gestion robuste obligatoire
require!(condition, CustomError::InvalidOperation);
// Logging structuré
msg!("ERROR: Operation failed - user: {}, amount: {}", user, amount);
// Recovery mechanisms
```

## 📋 Checklist de Migration Devnet → Mainnet

### **Phase 1: Préparation**
- [ ] Code audité par un tiers
- [ ] Tests exhaustifs passés
- [ ] Documentation complète
- [ ] Wallet mainnet créé et sécurisé
- [ ] Budget SOL disponible

### **Phase 2: Configuration**
- [ ] Anchor.toml mis à jour pour mainnet
- [ ] Variables d'environnement production
- [ ] RPC endpoint premium configuré
- [ ] Monitoring et alertes configurés

### **Phase 3: Déploiement**
- [ ] Build avec optimisations release
- [ ] Vérification taille du programme (<200KB idéal)
- [ ] Déploiement avec `anchor deploy --provider.cluster mainnet-beta`
- [ ] Vérification du déploiement
- [ ] Tests post-déploiement

### **Phase 4: Post-Déploiement**
- [ ] Monitoring actif 24/7
- [ ] Logs analysés régulièrement
- [ ] Plan de rollback prêt
- [ ] Support utilisateur en place
- [ ] Documentation mise à jour

## ⚠️ Points d'Attention Critiques

### **1. Irréversibilité**
- **Devnet**: Peut être reset, erreurs sans conséquences
- **Mainnet**: Transactions irréversibles, argent réel en jeu

### **2. Performance**
- **Devnet**: Performance variable acceptable
- **Mainnet**: Optimisation critique (coûts + UX)

### **3. Upgrades Programme**
- **Devnet**: Upgrades fréquents possibles
- **Mainnet**: Upgrades risqués, nécessitent tests exhaustifs

### **4. Frais de Transaction**
```javascript
// Devnet
const tx = new Transaction().add(instruction);
// Pas de souci pour les frais

// Mainnet
const tx = new Transaction().add(instruction);
// Optimiser pour minimiser les frais
tx.feePayer = payer;
tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
// Considérer le priority fee si nécessaire
```

## 🚀 Commandes de Déploiement

### **Devnet**
```bash
# Configuration
solana config set --url devnet

# Airdrop pour tests
solana airdrop 2

# Déploiement
anchor deploy --provider.cluster devnet
```

### **Mainnet**
```bash
# Configuration (ATTENTION: argent réel)
solana config set --url mainnet-beta

# Vérifier le solde (doit avoir ~2 SOL)
solana balance

# Build optimisé
anchor build

# Déploiement (IRRÉVERSIBLE)
anchor deploy --provider.cluster mainnet-beta

# Vérification
solana program show YOUR_PROGRAM_ID
```

## 📊 Métriques à Surveiller en Mainnet

1. **Taux de succès des transactions**
2. **Temps de réponse moyen**
3. **Coût moyen par transaction**
4. **Nombre d'utilisateurs actifs**
5. **Volume de SOL traité**
6. **Erreurs et leur fréquence**
7. **Utilisation de la capacité du programme**

## 🔥 Plan d'Urgence Mainnet

En cas de problème critique:
1. **Pause immédiate** du frontend
2. **Analyse des logs** et transactions
3. **Communication** transparente aux utilisateurs
4. **Fix** et tests exhaustifs
5. **Upgrade** du programme si nécessaire
6. **Post-mortem** et amélioration processus

---

**Note Importante**: Le passage en mainnet est une étape critique qui engage votre responsabilité financière et celle de vos utilisateurs. Assurez-vous d'avoir complété tous les tests et audits nécessaires avant le déploiement.