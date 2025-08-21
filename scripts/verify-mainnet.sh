#!/bin/bash

# Post-deployment verification script for mainnet
# Verifies that the deployment was successful and everything is working

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}       Mainnet Deployment Verification         ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Read program ID
if [ -f "$PROJECT_ROOT/.mainnet-program-id" ]; then
    PROGRAM_ID=$(cat "$PROJECT_ROOT/.mainnet-program-id")
    echo -e "${GREEN}Program ID: $PROGRAM_ID${NC}"
    echo ""
else
    echo -e "${RED}Error: Program ID file not found${NC}"
    echo "Have you deployed to mainnet yet?"
    exit 1
fi

# Configure for mainnet
echo -e "${YELLOW}Configuring for mainnet verification...${NC}"
solana config set --url https://api.mainnet-beta.solana.com &> /dev/null
echo ""

# 1. Verify Program Deployment
echo -e "${YELLOW}1. Program Verification${NC}"
echo "------------------------"
echo "Checking program account..."

PROGRAM_INFO=$(solana program show "$PROGRAM_ID" 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Program found on mainnet${NC}"
    echo "$PROGRAM_INFO" | head -n 5
else
    echo -e "${RED}✗ Program not found on mainnet${NC}"
    exit 1
fi
echo ""

# 2. Check Program Size and Rent
echo -e "${YELLOW}2. Program Details${NC}"
echo "------------------------"
ACCOUNT_INFO=$(solana account "$PROGRAM_ID" --output json)
if [ $? -eq 0 ]; then
    LAMPORTS=$(echo "$ACCOUNT_INFO" | jq -r '.lamports')
    DATA_LEN=$(echo "$ACCOUNT_INFO" | jq -r '.data[0]' | wc -c)
    EXECUTABLE=$(echo "$ACCOUNT_INFO" | jq -r '.executable')
    
    SOL_AMOUNT=$(echo "scale=9; $LAMPORTS / 1000000000" | bc)
    
    echo "Account Balance: $SOL_AMOUNT SOL"
    echo "Data Size: ~$(($DATA_LEN / 2)) bytes"
    echo "Executable: $EXECUTABLE"
    
    if [ "$EXECUTABLE" == "true" ]; then
        echo -e "${GREEN}✓ Program is executable${NC}"
    else
        echo -e "${RED}✗ Program is not executable${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Failed to get program details${NC}"
    exit 1
fi
echo ""

# 3. Check Program Authority
echo -e "${YELLOW}3. Program Authority${NC}"
echo "------------------------"
AUTHORITY=$(echo "$PROGRAM_INFO" | grep "ProgramData Address" | awk '{print $3}')
if [ ! -z "$AUTHORITY" ]; then
    echo "Program Authority: $AUTHORITY"
    echo -e "${YELLOW}⚠ Remember to transfer authority to a multisig for security${NC}"
else
    echo "Unable to determine program authority"
fi
echo ""

# 4. Test RPC Connection
echo -e "${YELLOW}4. RPC Connection Test${NC}"
echo "------------------------"
echo "Testing mainnet RPC endpoint..."
HEALTH=$(curl -s -X POST https://api.mainnet-beta.solana.com \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' | jq -r '.result')

if [ "$HEALTH" == "ok" ]; then
    echo -e "${GREEN}✓ RPC endpoint is healthy${NC}"
else
    echo -e "${YELLOW}⚠ RPC endpoint may be experiencing issues${NC}"
fi

# Test custom RPC if configured
if [ -f "$PROJECT_ROOT/.env.production" ]; then
    CUSTOM_RPC=$(grep "VITE_RPC_URL=" "$PROJECT_ROOT/.env.production" | cut -d'=' -f2)
    if [ ! -z "$CUSTOM_RPC" ] && [ "$CUSTOM_RPC" != "https://api.mainnet-beta.solana.com" ]; then
        echo "Testing custom RPC: $CUSTOM_RPC"
        CUSTOM_HEALTH=$(curl -s -X POST "$CUSTOM_RPC" \
            -H "Content-Type: application/json" \
            -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' | jq -r '.result' 2>/dev/null)
        
        if [ "$CUSTOM_HEALTH" == "ok" ]; then
            echo -e "${GREEN}✓ Custom RPC endpoint is healthy${NC}"
        else
            echo -e "${YELLOW}⚠ Custom RPC endpoint may need configuration${NC}"
        fi
    fi
fi
echo ""

# 5. Frontend Build Verification
echo -e "${YELLOW}5. Frontend Build${NC}"
echo "------------------------"
if [ -d "$PROJECT_ROOT/dist" ]; then
    echo -e "${GREEN}✓ Frontend build directory exists${NC}"
    echo "Build size: $(du -sh "$PROJECT_ROOT/dist" | cut -f1)"
    
    # Check if program ID is in the build
    if grep -q "$PROGRAM_ID" "$PROJECT_ROOT/dist/assets/"*.js 2>/dev/null; then
        echo -e "${GREEN}✓ Program ID found in frontend build${NC}"
    else
        echo -e "${YELLOW}⚠ Program ID not found in build files${NC}"
        echo "  You may need to rebuild the frontend"
    fi
else
    echo -e "${YELLOW}⚠ Frontend not built yet${NC}"
    echo "  Run: npm run build"
fi
echo ""

# 6. Transaction Test (Optional)
echo -e "${YELLOW}6. Transaction Capability${NC}"
echo "------------------------"
echo "Checking recent transactions..."
RECENT_TXS=$(solana transaction-history "$PROGRAM_ID" --limit 5 2>/dev/null | wc -l)
if [ $RECENT_TXS -gt 1 ]; then
    echo -e "${GREEN}✓ Program has transaction history${NC}"
    echo "Recent transactions: $(($RECENT_TXS - 1))"
else
    echo "No recent transactions found (this is normal for new deployments)"
fi
echo ""

# 7. Generate Test Commands
echo -e "${YELLOW}7. Useful Commands${NC}"
echo "------------------------"
echo "Monitor program logs:"
echo -e "${BLUE}  solana logs $PROGRAM_ID --url mainnet-beta${NC}"
echo ""
echo "Check program size:"
echo -e "${BLUE}  solana program show $PROGRAM_ID${NC}"
echo ""
echo "View recent transactions:"
echo -e "${BLUE}  solana transaction-history $PROGRAM_ID --limit 10${NC}"
echo ""

# Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}              Verification Summary              ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

if [ "$EXECUTABLE" == "true" ]; then
    echo -e "${GREEN}✅ Program successfully deployed to mainnet!${NC}"
    echo ""
    echo "Program ID: $PROGRAM_ID"
    echo ""
    echo "Next steps:"
    echo "1. Deploy frontend to your hosting provider"
    echo "2. Test all game functionality"
    echo "3. Monitor logs for any issues"
    echo "4. Set up error tracking and analytics"
    echo "5. Transfer program authority to multisig"
else
    echo -e "${RED}❌ Deployment verification failed${NC}"
    echo "Please check the errors above and redeploy if necessary"
fi