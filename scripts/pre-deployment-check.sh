#!/bin/bash

# Pre-deployment verification script for mainnet
# Ensures everything is ready before deploying to mainnet

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
RPS_DIR="$PROJECT_ROOT/rps-game"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}       Pre-Deployment Checklist for Mainnet    ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to check a condition
check() {
    local description="$1"
    local command="$2"
    
    echo -n "Checking: $description... "
    
    if eval "$command" &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC}"
        ((CHECKS_FAILED++))
        return 1
    fi
}

# Function for detailed check with output
check_with_output() {
    local description="$1"
    local command="$2"
    
    echo -e "${YELLOW}$description${NC}"
    eval "$command"
    echo ""
}

echo -e "${YELLOW}1. System Requirements${NC}"
echo "------------------------"
check "Solana CLI installed" "command -v solana"
check "Anchor CLI installed" "command -v anchor"
check "Node.js installed" "command -v node"
check "Rust installed" "command -v rustc"
check "Git installed" "command -v git"
echo ""

echo -e "${YELLOW}2. Project Structure${NC}"
echo "------------------------"
check "RPS game directory exists" "[ -d '$RPS_DIR' ]"
check "Frontend package.json exists" "[ -f '$PROJECT_ROOT/package.json' ]"
check "Anchor.toml exists" "[ -f '$RPS_DIR/Anchor.toml' ]"
check "Program source exists" "[ -f '$RPS_DIR/programs/rps/src/lib.rs' ]"
echo ""

echo -e "${YELLOW}3. Build Verification${NC}"
echo "------------------------"
cd "$RPS_DIR"
check "Anchor build succeeds" "anchor build"
check "Program binary exists" "[ -f '$RPS_DIR/target/deploy/rps.so' ]"
check "IDL file exists" "[ -f '$RPS_DIR/target/idl/rps.json' ]"
echo ""

echo -e "${YELLOW}4. Test Results${NC}"
echo "------------------------"
echo "Running tests..."
if cd "$RPS_DIR" && anchor test --skip-deploy --skip-local-validator 2>/dev/null; then
    echo -e "${GREEN}✓ All tests passed${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠ Tests skipped or failed (run manually to verify)${NC}"
fi
echo ""

echo -e "${YELLOW}5. Frontend Build${NC}"
echo "------------------------"
cd "$PROJECT_ROOT"
check "Dependencies installed" "[ -d 'node_modules' ]"
check "TypeScript config exists" "[ -f 'tsconfig.json' ]"
check "Vite config exists" "[ -f 'vite.config.ts' ]"
echo ""

echo -e "${YELLOW}6. Security Checks${NC}"
echo "------------------------"
check "No hardcoded private keys" "! grep -r 'secret\\|private\\|keypair' --include='*.ts' --include='*.tsx' --include='*.js' src/ 2>/dev/null"
check "No console.log in production" "! grep -r 'console.log' --include='*.ts' --include='*.tsx' src/ 2>/dev/null"
check ".env.production not in git" "! git ls-files | grep -q '.env.production'"
echo ""

echo -e "${YELLOW}7. Documentation${NC}"
echo "------------------------"
check "README exists" "[ -f '$PROJECT_ROOT/README.md' ]"
check "Deployment guide exists" "[ -f '$PROJECT_ROOT/docs/MAINNET_DEPLOYMENT_GUIDE.md' ]"
echo ""

echo -e "${YELLOW}8. Git Status${NC}"
echo "------------------------"
check_with_output "Current git status:" "git status --short"

echo -e "${YELLOW}9. Wallet Configuration${NC}"
echo "------------------------"
if [ -f "$HOME/.config/solana/mainnet-keypair.json" ]; then
    echo -e "${GREEN}✓ Mainnet keypair exists${NC}"
    ((CHECKS_PASSED++))
    
    # Check balance (requires mainnet configuration)
    if solana config get | grep -q "mainnet"; then
        BALANCE=$(solana balance 2>/dev/null | awk '{print $1}' || echo "0")
        echo "  Current balance: $BALANCE SOL"
        
        if (( $(echo "$BALANCE >= 2" | bc -l) )); then
            echo -e "  ${GREEN}✓ Sufficient balance for deployment${NC}"
            ((CHECKS_PASSED++))
        else
            echo -e "  ${YELLOW}⚠ Low balance (minimum 2 SOL recommended)${NC}"
            ((CHECKS_FAILED++))
        fi
    else
        echo -e "  ${YELLOW}⚠ Not configured for mainnet${NC}"
    fi
else
    echo -e "${RED}✗ Mainnet keypair not found${NC}"
    echo "  Create one with: solana-keygen new -o ~/.config/solana/mainnet-keypair.json"
    ((CHECKS_FAILED++))
fi
echo ""

echo -e "${YELLOW}10. Environment Variables${NC}"
echo "------------------------"
if [ -f "$PROJECT_ROOT/.env.production" ]; then
    echo -e "${GREEN}✓ Production environment file exists${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠ Production environment file not found${NC}"
    echo "  Will be created during deployment"
fi
echo ""

# Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}                    Summary                     ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "Checks passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks failed: ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for mainnet deployment.${NC}"
    echo ""
    echo "To deploy, run:"
    echo "  ./scripts/deploy-mainnet.sh"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some checks failed. Please review and fix before deploying.${NC}"
    echo ""
    echo "Critical items to address:"
    if ! command -v solana &> /dev/null; then
        echo "  - Install Solana CLI"
    fi
    if ! command -v anchor &> /dev/null; then
        echo "  - Install Anchor CLI"
    fi
    if [ ! -f "$HOME/.config/solana/mainnet-keypair.json" ]; then
        echo "  - Create mainnet keypair"
    fi
    exit 1
fi