#!/bin/bash

# 🚀 Universal PvP Deployment Script
echo "🎮 SolDuel Universal PvP - Deployment Script"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ Anchor is not installed. Please install it first.${NC}"
    echo "Visit: https://www.anchor-lang.com/docs/installation"
    exit 1
fi

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI is not installed. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"

# Step 1: Install dependencies
echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Step 2: Generate Program Keypair if it doesn't exist
if [ ! -f "target/deploy/universal_pvp-keypair.json" ]; then
    echo -e "\n${YELLOW}🔑 Generating program keypair...${NC}"
    solana-keygen new -o target/deploy/universal_pvp-keypair.json --force --no-bip39-passphrase
fi

# Get the program ID
PROGRAM_ID=$(solana address -k target/deploy/universal_pvp-keypair.json)
echo -e "${GREEN}📍 Program ID: $PROGRAM_ID${NC}"

# Step 3: Update Program ID in lib.rs
echo -e "\n${YELLOW}📝 Updating program ID in lib.rs...${NC}"
sed -i.bak "s/UNIVxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/$PROGRAM_ID/g" programs/universal_pvp/src/lib.rs

# Step 4: Update Anchor.toml
echo -e "${YELLOW}📝 Updating Anchor.toml...${NC}"
sed -i.bak "s/UNIVxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/$PROGRAM_ID/g" Anchor.toml

# Step 5: Build the program
echo -e "\n${YELLOW}🔨 Building program...${NC}"
anchor build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Please check the errors above.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"

# Step 6: Show deployment options
echo -e "\n${GREEN}🚀 Ready to deploy!${NC}"
echo "Choose your deployment target:"
echo "  1) Local (localnet)"
echo "  2) Devnet"
echo "  3) Mainnet (requires SOL)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo -e "\n${YELLOW}🌐 Deploying to localnet...${NC}"
        # Start local validator if not running
        if ! pgrep -x "solana-test-validator" > /dev/null; then
            echo "Starting local validator..."
            solana-test-validator &
            sleep 5
        fi
        anchor deploy
        ;;
    2)
        echo -e "\n${YELLOW}🌐 Deploying to devnet...${NC}"
        solana config set --url devnet
        
        # Check balance
        BALANCE=$(solana balance)
        echo -e "Current balance: $BALANCE"
        
        if [[ $BALANCE == "0 SOL" ]]; then
            echo -e "${YELLOW}Requesting airdrop...${NC}"
            solana airdrop 2
            sleep 5
        fi
        
        anchor deploy --provider.cluster devnet
        ;;
    3)
        echo -e "\n${YELLOW}⚠️  Mainnet deployment requires ~2 SOL${NC}"
        read -p "Are you sure? (y/n): " confirm
        if [[ $confirm == "y" ]]; then
            solana config set --url mainnet-beta
            anchor deploy --provider.cluster mainnet-beta
        else
            echo "Deployment cancelled."
        fi
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}📍 Program deployed at: $PROGRAM_ID${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run tests: npm test"
    echo "  2. Interact with the program using the SDK"
    echo "  3. Check the program on explorer:"
    echo "     https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi