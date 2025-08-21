# 🎮 Prompt pour Conception Programme Universel PvP Solana

## Contexte Initial
Je souhaite créer un programme Solana universel pour gérer TOUS mes jeux PvP sur ma plateforme SolDuel. Au lieu de déployer un programme par jeu (coût: 1.5 SOL chacun), je veux UN SEUL programme flexible qui peut gérer plusieurs types de jeux de paris entre joueurs.

## 🎯 Objectifs Principaux
1. **Un seul déploiement** pour économiser des SOL (2 SOL au lieu de 1.5 SOL × N jeux)
2. **Extensibilité** : Pouvoir ajouter de nouveaux jeux sans redéployer
3. **Sécurité** : Gestion sécurisée des paris et des fonds
4. **Flexibilité** : Support de différentes mécaniques de jeu
5. **Performance** : Optimisé pour minimiser les frais de transaction

## 📋 Questions Essentielles à Définir

### 1. TYPES DE JEUX ENVISAGÉS
**Question**: Quels types de jeux PvP veux-tu supporter ? Liste tous les jeux possibles.

**Exemples à considérer**:
- [ ] Pierre-Papier-Ciseaux (3 choix)
- [ ] Jeu de Dés (1-6 ou multiple dés)
- [ ] Pile ou Face (2 choix)
- [ ] Carte la plus haute (52 cartes)
- [ ] Roulette (Rouge/Noir, Pair/Impair, Numéros)
- [ ] Deviner un nombre (1-100)
- [ ] Combat de stats (Force vs Defense)
- [ ] Quiz/Trivia (Questions-Réponses)
- [ ] Loterie/Tirage
- [ ] Pierre-Papier-Ciseaux-Lézard-Spock (5 choix)
- [ ] Bataille navale simplifiée
- [ ] Morpion (Tic-Tac-Toe)
- [ ] Connect 4 simplifié
- [ ] _Autres ? (précise)_

### 2. MÉCANIQUES DE JEU
**Question**: Quelles mécaniques veux-tu supporter ?

**Choix simultanés cachés** (comme RPS actuel):
- [ ] Les deux joueurs choisissent en secret
- [ ] Révélation simultanée après engagement
- [ ] Hash-commit pour sécurité

**Choix en tours**:
- [ ] Joueur 1 joue, puis Joueur 2
- [ ] Tours alternés multiples
- [ ] Temps limité par tour

**Génération aléatoire**:
- [ ] Basée sur blockchain (hash de block)
- [ ] Basée sur commitments combinés
- [ ] Oracle externe (Chainlink VRF)
- [ ] Pseudo-aléatoire suffisant

### 3. TYPES DE PARIS
**Question**: Quels types de mises veux-tu permettre ?

**Montants**:
- [ ] Mise fixe par type de jeu
- [ ] Mise variable (min-max)
- [ ] Mise progressive (augmente à chaque round)
- [ ] Mise asymétrique (cotes différentes)

**Devises**:
- [ ] SOL natif uniquement
- [ ] SPL tokens (USDC, custom tokens)
- [ ] Multi-tokens dans un même jeu
- [ ] NFTs comme mise

**Distribution**:
- [ ] Winner-takes-all (gagnant prend tout)
- [ ] Partage proportionnel (en cas d'égalité)
- [ ] Système de points/scores
- [ ] Jackpot progressif

### 4. NOMBRE DE JOUEURS
**Question**: Combien de joueurs par match ?

- [ ] Toujours 1v1 (2 joueurs)
- [ ] Support 1v1 à 1vN (multijoueur)
- [ ] Tournois (élimination)
- [ ] Pools de joueurs (tous contre tous)
- [ ] Équipes (2v2, 3v3)

### 5. DURÉE ET ROUNDS
**Question**: Comment gérer le temps et les rounds ?

**Durée**:
- [ ] Match unique (one-shot)
- [ ] Best of 3/5/7
- [ ] Rounds illimités jusqu'à victoire
- [ ] Temps limité global

**Timeouts**:
- [ ] Timeout pour rejoindre (5 min)
- [ ] Timeout pour révéler (2 min)
- [ ] Timeout par tour (30 sec)
- [ ] Penalties pour timeout

### 6. SYSTÈME DE FRAIS
**Question**: Comment monétiser la plateforme ?

- [ ] Frais fixes (0.01 SOL par match)
- [ ] Frais en pourcentage (2-5% du pot)
- [ ] Frais variables selon le jeu
- [ ] Abonnement/Pass mensuel
- [ ] Frais sur les gains seulement
- [ ] Token de gouvernance avec réductions

### 7. FONCTIONNALITÉS SPÉCIALES
**Question**: Quelles features avancées veux-tu ?

**Matchmaking**:
- [ ] Matchmaking par niveau/ELO
- [ ] Salles privées avec code
- [ ] Matchs publics ouverts
- [ ] File d'attente automatique

**Statistiques**:
- [ ] Historique des matchs
- [ ] Ratio victoire/défaite
- [ ] Leaderboards globaux
- [ ] Achievements/Badges

**Social**:
- [ ] Chat pendant le match
- [ ] Émojis/Réactions
- [ ] Spectateurs autorisés
- [ ] Replay des matchs

**Économie**:
- [ ] Token de récompense natif
- [ ] Système de niveaux/XP
- [ ] Bonus de connexion quotidien
- [ ] Cashback sur pertes

### 8. SÉCURITÉ ET ANTI-TRICHE
**Question**: Quelles mesures de sécurité sont prioritaires ?

- [ ] Anti-collusion (empêcher 2 comptes du même joueur)
- [ ] Vérification d'identité (KYC light)
- [ ] Limites de mise par jour
- [ ] Détection de patterns suspects
- [ ] Multisig pour les gros pots
- [ ] Audit du code obligatoire

### 9. INTÉGRATION TECHNIQUE
**Question**: Comment le programme doit s'intégrer ?

**Frontend**:
- [ ] Web uniquement
- [ ] Application mobile native
- [ ] Intégration wallet (Phantom, Solflare)
- [ ] Support multi-wallets

**Backend**:
- [ ] 100% on-chain
- [ ] Hybrid (métadonnées off-chain)
- [ ] API REST pour stats
- [ ] WebSocket pour temps réel

**Scalabilité**:
- [ ] Combien de matchs simultanés ? (100, 1000, 10000+)
- [ ] Compression des données
- [ ] State compression de Solana
- [ ] Archivage des vieux matchs

### 10. ÉVOLUTION FUTURE
**Question**: Comment le programme doit évoluer ?

- [ ] Programme upgradeable ou immutable ?
- [ ] Système de modules/plugins ?
- [ ] Votes de gouvernance pour nouveaux jeux ?
- [ ] Fork possible pour white-label ?
- [ ] API pour développeurs tiers ?

## 🏗️ Architecture Proposée

```rust
// Structure suggérée à valider
pub struct UniversalPvPProgram {
    // Configuration globale
    treasury: Pubkey,
    fee_structure: FeeConfig,
    supported_games: Vec<GameType>,
    
    // État des matchs
    active_matches: HashMap<Pubkey, Match>,
    match_history: Vec<CompletedMatch>,
    
    // Système de joueurs
    player_stats: HashMap<Pubkey, PlayerProfile>,
    elo_ratings: HashMap<(Pubkey, GameType), u32>,
    
    // Configuration par jeu
    game_configs: HashMap<GameType, GameRules>,
}
```

## 📊 Matrice de Décision

| Critère | Option Simple | Option Complexe | Recommandation |
|---------|--------------|-----------------|----------------|
| **Jeux** | 3-5 types fixes | Système extensible | ? |
| **Joueurs** | 1v1 seulement | Multi-joueurs | ? |
| **Paris** | SOL uniquement | Multi-tokens | ? |
| **Frais** | 3% fixe | Variable + token | ? |
| **Évolution** | Immutable | Upgradeable | ? |

## 💰 Analyse Coût-Bénéfice

### Scénario A: Programme Simple (3-5 jeux)
- **Coût déploiement**: 1.8 SOL
- **Complexité**: Faible
- **Time to market**: 2 semaines
- **Maintenance**: Facile

### Scénario B: Programme Modulaire (10+ jeux)
- **Coût déploiement**: 2.5 SOL
- **Complexité**: Moyenne
- **Time to market**: 1 mois
- **Maintenance**: Modérée

### Scénario C: Plateforme Complète (illimité)
- **Coût déploiement**: 3 SOL
- **Complexité**: Élevée
- **Time to market**: 2-3 mois
- **Maintenance**: Complexe

## 🎯 Questions Finales pour la Session

1. **Priorité #1**: Lancer vite avec 3-5 jeux OU construire pour 50+ jeux futurs ?

2. **Budget**: Combien de SOL disponibles pour le déploiement ? (2-5 SOL)

3. **Timeline**: Lancement dans 2 semaines, 1 mois, ou 3 mois ?

4. **Compétition**: Quels sont vos concurrents directs ? Que font-ils de mieux/pire ?

5. **USP (Unique Selling Point)**: Qu'est-ce qui rendra SolDuel unique ?

6. **Volume cible**: Combien de matchs par jour visez-vous ? (100, 1000, 10000)

7. **Revenu cible**: Objectif de revenus mensuels ? (Aide à dimensionner les frais)

8. **Équipe**: Développez-vous seul ou avec une équipe ?

9. **Marketing**: Comment attirer les premiers joueurs ?

10. **Régulation**: Contraintes légales dans votre juridiction ?

## 📝 Template de Réponse

```markdown
# Configuration Programme Universel PvP SolDuel

## Jeux Supportés
- Pierre-Papier-Ciseaux ✅
- Dés (1-6) ✅
- Pile ou Face ✅
- [Ajouter vos choix...]

## Mécaniques Choisies
- Type: [Simultané caché / Tours / Mixte]
- Randomisation: [Hash blockchain / Commitments]
- Rounds: [Single / Best of X]

## Système de Paris
- Devises: [SOL / USDC / Both]
- Mise min: [0.01 SOL]
- Mise max: [100 SOL]
- Frais plateforme: [3%]

## Priorités de Développement
1. [Feature la plus importante]
2. [Deuxième priorité]
3. [Troisième priorité]

## Contraintes
- Budget: [X SOL]
- Délai: [X semaines]
- Expertise: [Solana/Rust niveau]
```

---

## 🚀 Prochaine Étape

**Utilise ce prompt dans une nouvelle session Claude pour définir précisément ton programme universel PvP.**

Exemple de message pour la nouvelle session:
```
"Je veux concevoir un programme Solana universel pour jeux PvP. Voici mes réponses au questionnaire:
[Copier-coller tes réponses aux questions ci-dessus]

Aide-moi à:
1. Finaliser l'architecture technique
2. Estimer précisément les coûts
3. Créer le code Rust complet
4. Planifier l'implémentation étape par étape"
```

Ce document te permettra d'avoir une discussion structurée et complète pour créer le programme parfait pour tes besoins !