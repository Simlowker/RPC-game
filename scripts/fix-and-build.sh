#!/bin/bash

# Script pour fixer le problème Cargo.lock et builder pour Mainnet

echo "🔧 Fixing Cargo.lock and building for Mainnet..."

cd /Users/simeonfluck/teste\ 3/platform/programs/universal_pvp

# 1. Supprimer tous les Cargo.lock
echo "📦 Cleaning Cargo.lock files..."
find .. -name "Cargo.lock" -type f -delete

# 2. Générer un nouveau Cargo.lock avec cargo normal
echo "📝 Generating new Cargo.lock..."
cargo generate-lockfile

# 3. Forcer la version 3 dans le Cargo.lock
echo "🔄 Converting to version 3..."
if [ -f "Cargo.lock" ]; then
    sed -i '' 's/version = 4/version = 3/' Cargo.lock
    echo "✅ Cargo.lock converted to version 3"
fi

# 4. Maintenant essayer de builder
echo "🏗️ Building with cargo-build-sbf..."
cargo-build-sbf

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📊 Program info:"
    ls -lh ../../target/deploy/*.so 2>/dev/null || ls -lh target/deploy/*.so 2>/dev/null
else
    echo "⚠️ cargo-build-sbf failed, trying alternative..."
    
    # Alternative: utiliser anchor build
    cd ../..
    
    # Fixer tous les Cargo.lock
    find . -name "Cargo.lock" -exec sed -i '' 's/version = 4/version = 3/' {} \;
    
    echo "🔨 Building with anchor..."
    anchor build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful with anchor!"
        ls -lh target/deploy/*.so
    else
        echo "❌ Build failed"
        exit 1
    fi
fi

echo ""
echo "🎯 Ready for deployment!"