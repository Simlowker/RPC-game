#!/bin/bash

# SolDuel RPS Platform - Mainnet Deployment Script
# This script handles the complete mainnet deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
RPS_DIR="$PROJECT_ROOT/rps-game"

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   SolDuel RPS Platform - Mainnet Deployment   ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check Solana CLI
    if ! command -v solana &> /dev/null; then
        echo -e "${RED}Error: Solana CLI not found${NC}"
        exit 1
    fi
    
    # Check Anchor CLI
    if ! command -v anchor &> /dev/null; then
        echo -e "${RED}Error: Anchor CLI not found${NC}"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All prerequisites met${NC}"
}

# Function to configure for mainnet
configure_mainnet() {
    echo -e "${YELLOW}Configuring for mainnet...${NC}"
    
    # Check if mainnet keypair exists
    if [ ! -f "$HOME/.config/solana/mainnet-keypair.json" ]; then
        echo -e "${RED}Error: Mainnet keypair not found at ~/.config/solana/mainnet-keypair.json${NC}"
        echo "Please create a mainnet keypair first:"
        echo "  solana-keygen new -o ~/.config/solana/mainnet-keypair.json"
        exit 1
    fi
    
    # Set Solana CLI to mainnet
    solana config set --url https://api.mainnet-beta.solana.com
    solana config set --keypair ~/.config/solana/mainnet-keypair.json
    
    echo -e "${GREEN}✓ Configured for mainnet${NC}"
}

# Function to check wallet balance
check_balance() {
    echo -e "${YELLOW}Checking wallet balance...${NC}"
    
    BALANCE=$(solana balance | awk '{print $1}')
    echo "Current balance: $BALANCE SOL"
    
    # Check if balance is sufficient (at least 2 SOL recommended)
    if (( $(echo "$BALANCE < 2" | bc -l) )); then
        echo -e "${RED}Warning: Insufficient balance for deployment${NC}"
        echo "Recommended: At least 2 SOL for program deployment"
        read -p "Do you want to continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo -e "${GREEN}✓ Sufficient balance for deployment${NC}"
    fi
}

# Function to build the program
build_program() {
    echo -e "${YELLOW}Building program...${NC}"
    
    cd "$RPS_DIR"
    
    # Clean previous builds
    anchor clean
    
    # Build for mainnet
    anchor build
    
    if [ -f "target/deploy/rps.so" ]; then
        echo -e "${GREEN}✓ Program built successfully${NC}"
        ls -lh target/deploy/rps.so
    else
        echo -e "${RED}Error: Build failed${NC}"
        exit 1
    fi
}

# Function to deploy program
deploy_program() {
    echo -e "${YELLOW}Deploying program to mainnet...${NC}"
    echo -e "${RED}⚠️  WARNING: This will deploy to MAINNET and cost SOL!${NC}"
    
    read -p "Are you sure you want to deploy to mainnet? (yes/no) " -r
    if [[ ! $REPLY == "yes" ]]; then
        echo "Deployment cancelled"
        exit 0
    fi
    
    cd "$RPS_DIR"
    
    # Deploy using mainnet configuration
    anchor deploy --provider.cluster mainnet-beta --provider.wallet ~/.config/solana/mainnet-keypair.json
    
    # Get the deployed program ID
    PROGRAM_ID=$(solana address -k target/deploy/rps-keypair.json)
    echo -e "${GREEN}✓ Program deployed successfully${NC}"
    echo -e "${GREEN}Program ID: $PROGRAM_ID${NC}"
    
    # Save program ID
    echo "$PROGRAM_ID" > "$PROJECT_ROOT/.mainnet-program-id"
    
    # Update Anchor.toml with the program ID
    sed -i.bak "s/rps = \".*\"/rps = \"$PROGRAM_ID\"/" Anchor.mainnet.toml
    
    echo -e "${YELLOW}Program ID saved to .mainnet-program-id${NC}"
}

# Function to verify deployment
verify_deployment() {
    echo -e "${YELLOW}Verifying deployment...${NC}"
    
    if [ -f "$PROJECT_ROOT/.mainnet-program-id" ]; then
        PROGRAM_ID=$(cat "$PROJECT_ROOT/.mainnet-program-id")
        
        # Check if program exists and is executable
        ACCOUNT_INFO=$(solana account "$PROGRAM_ID" --output json 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            EXECUTABLE=$(echo "$ACCOUNT_INFO" | jq -r '.executable')
            if [ "$EXECUTABLE" == "true" ]; then
                echo -e "${GREEN}✓ Program verified: $PROGRAM_ID${NC}"
                solana program show "$PROGRAM_ID"
            else
                echo -e "${RED}Error: Program is not executable${NC}"
                exit 1
            fi
        else
            echo -e "${RED}Error: Program not found on chain${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Error: Program ID file not found${NC}"
        exit 1
    fi
}

# Function to update frontend configuration
update_frontend() {
    echo -e "${YELLOW}Updating frontend configuration...${NC}"
    
    if [ -f "$PROJECT_ROOT/.mainnet-program-id" ]; then
        PROGRAM_ID=$(cat "$PROJECT_ROOT/.mainnet-program-id")
        
        # Create production environment file
        cat > "$PROJECT_ROOT/.env.production" <<EOF
# Mainnet Configuration
VITE_NETWORK=mainnet-beta
VITE_RPC_URL=https://api.mainnet-beta.solana.com
VITE_PROGRAM_ID=$PROGRAM_ID
VITE_GAMBA_PROGRAM_ID=GambaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EOF
        
        echo -e "${GREEN}✓ Frontend configuration updated${NC}"
        echo "Created .env.production with mainnet settings"
    else
        echo -e "${RED}Error: Program ID not found${NC}"
        exit 1
    fi
}

# Function to build frontend
build_frontend() {
    echo -e "${YELLOW}Building frontend for production...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    # Build for production
    npm run build
    
    if [ -d "dist" ]; then
        echo -e "${GREEN}✓ Frontend built successfully${NC}"
        du -sh dist/
    else
        echo -e "${RED}Error: Frontend build failed${NC}"
        exit 1
    fi
}

# Function to create deployment summary
create_summary() {
    echo -e "${YELLOW}Creating deployment summary...${NC}"
    
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    PROGRAM_ID=$(cat "$PROJECT_ROOT/.mainnet-program-id" 2>/dev/null || echo "Not deployed")
    WALLET=$(solana address)
    
    cat > "$PROJECT_ROOT/DEPLOYMENT_SUMMARY.md" <<EOF
# Mainnet Deployment Summary

## Deployment Information
- **Date**: $TIMESTAMP
- **Network**: Mainnet-Beta
- **Program ID**: \`$PROGRAM_ID\`
- **Deployer Wallet**: \`$WALLET\`

## Build Artifacts
- Program Binary: \`rps-game/target/deploy/rps.so\`
- Frontend Build: \`dist/\`

## Configuration Files
- Mainnet Anchor Config: \`rps-game/Anchor.mainnet.toml\`
- Production Environment: \`.env.production\`

## Next Steps
1. Deploy frontend to hosting provider
2. Configure custom RPC endpoint for production
3. Set up monitoring and alerts
4. Transfer program upgrade authority to multisig

## Verification Commands
\`\`\`bash
# Verify program deployment
solana program show $PROGRAM_ID

# Check program logs
solana logs $PROGRAM_ID --url mainnet-beta

# Test connection
curl https://api.mainnet-beta.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
\`\`\`
EOF
    
    echo -e "${GREEN}✓ Deployment summary created${NC}"
}

# Main deployment flow
main() {
    echo "Starting mainnet deployment process..."
    echo ""
    
    check_prerequisites
    echo ""
    
    configure_mainnet
    echo ""
    
    check_balance
    echo ""
    
    build_program
    echo ""
    
    deploy_program
    echo ""
    
    verify_deployment
    echo ""
    
    update_frontend
    echo ""
    
    build_frontend
    echo ""
    
    create_summary
    echo ""
    
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}     Mainnet Deployment Completed Successfully!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo "Program ID: $(cat "$PROJECT_ROOT/.mainnet-program-id")"
    echo ""
    echo "Next steps:"
    echo "1. Deploy the frontend (dist/) to your hosting provider"
    echo "2. Configure a premium RPC endpoint for production"
    echo "3. Set up monitoring and error tracking"
    echo "4. Secure the program upgrade authority"
    echo ""
    echo "See DEPLOYMENT_SUMMARY.md for details"
}

# Run main function
main