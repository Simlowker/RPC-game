#!/bin/bash

# Deploy RPS Game to Solana Devnet
set -e

echo "🚀 Deploying RPS Game to Solana Devnet..."

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install it first."
    exit 1
fi

# Check if Anchor CLI is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not found. Please install it first."
    exit 1
fi

# Configure Solana for devnet
echo "📡 Configuring Solana for devnet..."
solana config set --url devnet

# Check balance
echo "💰 Checking wallet balance..."
BALANCE=$(solana balance --lamports)
REQUIRED_BALANCE=500000000  # 0.5 SOL in lamports

if [ "$BALANCE" -lt "$REQUIRED_BALANCE" ]; then
    echo "🪂 Requesting airdrop..."
    solana airdrop 2
    sleep 5
fi

# Build the program
echo "🔨 Building Anchor program..."
anchor build

# Update program ID if needed
PROGRAM_ID=$(solana address -k target/deploy/rps-keypair.json)
echo "📋 Program ID: $PROGRAM_ID"

# Update Anchor.toml with correct program ID
sed -i.bak "s/rps = \".*\"/rps = \"$PROGRAM_ID\"/" Anchor.toml

# Update lib.rs with correct program ID
sed -i.bak "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" programs/rps/src/lib.rs

# Rebuild with correct program ID
echo "🔨 Rebuilding with correct program ID..."
anchor build

# Deploy the program
echo "🚀 Deploying to devnet..."
anchor deploy

# Verify deployment
echo "✅ Verifying deployment..."
solana program show $PROGRAM_ID

echo "🎉 Deployment complete!"
echo "Program ID: $PROGRAM_ID"
echo "Network: Devnet"
echo "Next steps:"
echo "1. Update the PROGRAM_ID in app/src/utils/anchor.ts"
echo "2. Run 'npm run app:dev' to start the frontend"