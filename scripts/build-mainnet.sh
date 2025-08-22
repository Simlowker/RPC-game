#!/bin/bash

# Script de build optimisé pour Mainnet
# Utilise cargo-build-sbf qui est la méthode préférée actuelle

echo "🚀 Building SolDuel for Mainnet..."

# 1. Nettoyer les builds précédents
echo "📦 Cleaning previous builds..."
rm -rf target/deploy
rm -rf programs/universal_pvp/target

# 2. S'assurer qu'on utilise la bonne version de Rust
echo "🔧 Setting Rust to stable..."
rustup default stable

# 3. Build avec cargo-build-sbf (méthode préférée)
echo "🏗️ Building with cargo-build-sbf..."
cd programs/universal_pvp

# Créer un Cargo.lock avec version 3 si nécessaire
if [ -f "Cargo.lock" ]; then
    # Si le fichier existe et a version 4, le modifier
    if grep -q "version = 4" Cargo.lock; then
        echo "📝 Fixing Cargo.lock version..."
        sed -i.bak 's/version = 4/version = 3/' Cargo.lock
        rm Cargo.lock.bak
    fi
else
    # Créer un nouveau Cargo.lock avec la bonne version
    echo "📝 Creating Cargo.lock..."
    cargo generate-lockfile
    # Forcer la version 3 si nécessaire
    if grep -q "version = 4" Cargo.lock; then
        sed -i.bak 's/version = 4/version = 3/' Cargo.lock
        rm Cargo.lock.bak
    fi
fi

# 4. Builder le programme
echo "🔨 Building program..."
cargo-build-sbf --manifest-path Cargo.toml

# 5. Vérifier le build
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📊 Program size:"
    ls -lh ../../target/deploy/*.so
else
    echo "❌ Build failed. Trying alternative method..."
    
    # Alternative: utiliser anchor build avec workaround
    cd ../..
    
    # Modifier temporairement tous les Cargo.lock pour version 3
    find . -name "Cargo.lock" -exec sed -i.bak 's/version = 4/version = 3/' {} \;
    
    # Essayer anchor build
    anchor build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful with anchor!"
    else
        echo "❌ Build failed. Please check the errors above."
        exit 1
    fi
fi

echo "🎯 Build complete! Ready for deployment."
echo ""
echo "📋 Next steps:"
echo "1. Test on devnet: anchor deploy --provider.cluster devnet"
echo "2. Run tests: anchor test"
echo "3. Deploy to mainnet: anchor deploy --provider.cluster mainnet"