#!/bin/bash

# Solana Mainnet Keypair Generation Script
# This script safely generates a new Solana keypair for mainnet use

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
KEYPAIR_PATH="$HOME/.config/solana/mainnet-keypair.json"
BACKUP_DIR="$HOME/.config/solana/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Solana Mainnet Keypair Generator    ${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Check if Solana CLI is installed
if ! command -v solana-keygen &> /dev/null; then
    echo -e "${RED}Error: Solana CLI is not installed.${NC}"
    echo "Please install it first:"
    echo "sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

# Check if keypair already exists
if [ -f "$KEYPAIR_PATH" ]; then
    echo -e "${YELLOW}Warning: A mainnet keypair already exists at:${NC}"
    echo "$KEYPAIR_PATH"
    echo
    read -p "Do you want to backup and replace it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    
    # Create backup
    mkdir -p "$BACKUP_DIR"
    BACKUP_PATH="$BACKUP_DIR/mainnet-keypair-$TIMESTAMP.json"
    cp "$KEYPAIR_PATH" "$BACKUP_PATH"
    echo -e "${GREEN}Existing keypair backed up to:${NC}"
    echo "$BACKUP_PATH"
    echo
fi

# Security warnings
echo -e "${RED}⚠️  IMPORTANT SECURITY WARNINGS ⚠️${NC}"
echo "1. This will generate a REAL mainnet keypair"
echo "2. NEVER share your seed phrase or private key"
echo "3. WRITE DOWN your seed phrase immediately"
echo "4. Store it in a secure offline location"
echo "5. This keypair will control real SOL tokens"
echo
read -p "Do you understand and want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo
echo -e "${BLUE}Generating new mainnet keypair...${NC}"
echo

# Generate the keypair
if solana-keygen new --outfile "$KEYPAIR_PATH"; then
    echo
    echo -e "${GREEN}✅ Keypair generated successfully!${NC}"
    
    # Set secure permissions
    chmod 600 "$KEYPAIR_PATH"
    echo -e "${GREEN}✅ Secure permissions set (600)${NC}"
    
    # Get public key
    PUBLIC_KEY=$(solana-keygen pubkey "$KEYPAIR_PATH")
    
    echo
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}Keypair Information:${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo "Location: $KEYPAIR_PATH"
    echo "Public Key: $PUBLIC_KEY"
    echo
    
    # Configuration options
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Configure Solana CLI for mainnet:"
    echo "   solana config set --url https://api.mainnet-beta.solana.com"
    echo "   solana config set --keypair $KEYPAIR_PATH"
    echo
    echo "2. Check your balance:"
    echo "   solana balance"
    echo
    echo "3. Get your address for funding:"
    echo "   solana address"
    echo
    
    # Offer to configure now
    read -p "Would you like to configure Solana CLI for mainnet now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Configuring Solana CLI...${NC}"
        solana config set --url https://api.mainnet-beta.solana.com
        solana config set --keypair "$KEYPAIR_PATH"
        echo -e "${GREEN}✅ Configuration complete!${NC}"
        echo
        echo "Current configuration:"
        solana config get
        echo
        echo "Current balance:"
        solana balance
    fi
    
    echo
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ Setup Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo
    echo -e "${RED}⚠️  CRITICAL REMINDERS:${NC}"
    echo "1. Your seed phrase is your ONLY recovery method"
    echo "2. Store it offline in multiple secure locations"
    echo "3. Never enter it on websites or share it"
    echo "4. Consider using a hardware wallet for large amounts"
    echo
    echo "Your public key (safe to share): $PUBLIC_KEY"
    
else
    echo -e "${RED}Error: Failed to generate keypair${NC}"
    exit 1
fi