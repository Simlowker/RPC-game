#!/bin/bash

# Setup development environment for RPS Game
set -e

echo "🛠️  Setting up RPS Game development environment..."

# Install dependencies
echo "📦 Installing root dependencies..."
yarn install

echo "📦 Installing frontend dependencies..."
cd app
npm install --legacy-peer-deps
cd ..

# Generate program types
echo "🔧 Generating program types..."
if [ -f "target/types/rps.ts" ]; then
    echo "Types already exist"
else
    echo "Building program to generate types..."
    anchor build
fi

# Copy IDL to frontend
echo "📋 Copying IDL to frontend..."
mkdir -p app/src/idl
cp target/idl/rps.json app/src/idl/

echo "✅ Development environment setup complete!"
echo "Next steps:"
echo "1. Run 'anchor test' to run tests"
echo "2. Run 'npm run deploy' to deploy to devnet"
echo "3. Run 'npm run app:dev' to start the frontend"