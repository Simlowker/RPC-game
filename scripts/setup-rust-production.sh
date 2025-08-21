#!/bin/bash
# Script de configuration Rust pour production

set -e

echo "🦀 Configuration Rust pour production..."

# Vérifier Rust
echo "📋 Versions actuelles:"
rustc --version
cargo --version

# Configurer stable
echo "⚙️ Configuration toolchain stable..."
rustup default stable
rustup update stable
rustup component add rustfmt clippy rust-src

# Nettoyer projet
echo "🧹 Nettoyage du projet..."
cd rps-game
cargo clean
rm -f Cargo.lock

# Installer outils sécurité
echo "🔐 Installation cargo-audit..."
cargo install cargo-audit --force

# Build et validation
echo "🏗️ Build et validation..."
cargo build
cargo test
cargo clippy --all-targets --all-features -- -D warnings
cargo fmt --all -- --check
cargo build --release
cargo audit

echo "✅ Configuration production terminée!"
echo ""
echo "📋 Commandes utiles:"
echo "  cargo build --release  # Build optimisé"
echo "  cargo test             # Tests"
echo "  cargo clippy           # Linting"
echo "  cargo fmt              # Formatage"
echo "  cargo audit            # Audit sécurité"