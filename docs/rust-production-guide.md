# Guide de Production Rust

## Configuration Stable

Le projet est configuré pour utiliser Rust stable en production avec:

- **Toolchain**: Stable avec rustfmt, clippy, rust-src
- **Target**: wasm32-unknown-unknown pour Solana
- **Optimisations**: Release avec LTO et optimisations de taille

## Structure du Projet

```
platform/
├── config/
│   ├── rust-toolchain.toml     # Configuration toolchain
│   └── .github-workflows-rust.yml # Template CI/CD
├── docs/
│   └── rust-production-guide.md # Ce guide
├── scripts/
│   └── setup-rust-production.sh # Script setup
└── rps-game/
    ├── Cargo.toml              # Configuration optimisée
    ├── src/
    └── target/                 # Artefacts de build
```

## Commandes de Production

### Build et Tests
```bash
cd rps-game
cargo build --release    # Build optimisé production
cargo test               # Tests unitaires
cargo clippy            # Linting statique
cargo fmt               # Formatage code
```

### Sécurité
```bash
cargo audit             # Audit dépendances
cargo outdated          # Vérifier versions
```

### Développement
```bash
cargo check             # Vérification rapide
cargo doc --open        # Documentation
```

## Configuration Cargo.toml

### Profils Optimisés
- **Release**: LTO complet, optimisation taille
- **Dev**: Debug complet, vérifications overflow

### Métadonnées
- Licence, auteurs, repository configurés
- Mots-clés et catégories pour publication

## CI/CD Pipeline

Le pipeline GitHub Actions inclut:
1. **Format check** - cargo fmt
2. **Linting** - cargo clippy
3. **Tests** - cargo test
4. **Build release** - cargo build --release
5. **Security audit** - cargo audit

## Résolution Problèmes

### Cargo.lock v4
- Supprimé et régénéré avec stable
- Cache Cargo nettoyé
- Toolchain mis à jour

### Performance
- LTO activé pour réduire taille binaire
- Optimisations de niveau "z" pour WASM
- Panic=abort pour réduire overhead

## Sécurité

### Audit Automatique
- cargo-audit installé
- Vérifications CI/CD
- Profil dev avec overflow-checks

### Bonnes Pratiques
- Pas de unwrap() en production
- Validation entrées utilisateur
- Gestion erreurs explicite

## Déploiement

1. **Tests locaux**: `cargo test`
2. **Build release**: `cargo build --release`
3. **Audit sécurité**: `cargo audit`
4. **Deploy WASM**: Vers cluster Solana

Le projet est maintenant prêt pour la production!