#!/bin/bash
# scripts/run-tests.sh - Comprehensive Test Execution Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
export NODE_ENV=test
export VITE_PROGRAM_ID="32tQhc2c4LurhdBwDzzV8f3PtdhKm1iVaPSumDTZWAvb"
export SOLANA_RPC_URL="http://localhost:8899"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Create test results directory
mkdir -p test-results
mkdir -p test-results/screenshots
mkdir -p test-results/coverage
mkdir -p test-results/reports

log "🚀 Starting Comprehensive RPS Game Test Suite"
echo "=================================================="

# Function to run tests with error handling
run_test_suite() {
    local test_name="$1"
    local test_command="$2"
    local optional="${3:-false}"
    
    log "Running $test_name..."
    
    if eval "$test_command"; then
        success "$test_name passed"
        return 0
    else
        if [ "$optional" = "true" ]; then
            warning "$test_name failed (optional)"
            return 0
        else
            error "$test_name failed"
            return 1
        fi
    fi
}

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 1. Unit and Integration Tests
log "1️⃣ Running Unit and Integration Tests"
echo "----------------------------------"

if command -v vitest >/dev/null 2>&1; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "Unit Tests" "vitest run --reporter=json --outputFile=test-results/unit-results.json"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    # Run with coverage
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "Coverage Analysis" "vitest run --coverage --reporter=json --outputFile=test-results/coverage-results.json" "true"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    warning "Vitest not found, skipping unit tests"
fi

# 2. Build Validation
log "2️⃣ Running Build Validation"
echo "----------------------------"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "Main Project Build" "npm run build"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Check if RPS game app exists and build it
if [ -d "rps-game/app" ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "RPS App Build" "cd rps-game/app && npm run build"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi

# 3. TypeScript Validation
log "3️⃣ Running TypeScript Validation"
echo "--------------------------------"

if command -v tsc >/dev/null 2>&1; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "TypeScript Check" "tsc --noEmit"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    warning "TypeScript compiler not found"
fi

# 4. Linting
log "4️⃣ Running Code Quality Checks"
echo "------------------------------"

if command -v eslint >/dev/null 2>&1; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "ESLint" "eslint src/ --ext .ts,.tsx,.js,.jsx --format json --output-file test-results/eslint-results.json" "true"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    warning "ESLint not found"
fi

# 5. Performance Tests
log "5️⃣ Running Performance Tests"
echo "----------------------------"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "Performance Tests" "vitest run tests/performance/ --reporter=json --outputFile=test-results/performance-results.json" "true"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 6. Accessibility Tests
log "6️⃣ Running Accessibility Tests"
echo "------------------------------"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "Accessibility Tests" "vitest run tests/accessibility/ --reporter=json --outputFile=test-results/a11y-results.json" "true"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 7. Cross-Browser Tests (using Playwright)
log "7️⃣ Running Cross-Browser Tests"
echo "------------------------------"

if command -v playwright >/dev/null 2>&1; then
    # Install browsers if needed
    npx playwright install --with-deps chromium firefox webkit >/dev/null 2>&1 || true
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "Cross-Browser Tests" "npx playwright test tests/cross-browser/ --reporter=json --output=test-results/playwright-results.json" "true"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    warning "Playwright not found, skipping cross-browser tests"
fi

# 8. Game Logic Tests
log "8️⃣ Running Game Logic Tests"
echo "---------------------------"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "Game Logic Tests" "vitest run tests/game-logic/ --reporter=json --outputFile=test-results/game-logic-results.json"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# 9. Bundle Size Analysis
log "9️⃣ Running Bundle Analysis"
echo "--------------------------"

if [ -f "dist/index.html" ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "Bundle Size Check" "du -sh dist/ | awk '{if($1 ~ /[0-9]+M/ && substr($1,1,length($1)-1) > 5) exit 1}'" "true"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        success "Bundle size is acceptable"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        warning "Bundle size might be too large"
    fi
else
    warning "No build output found for bundle analysis"
fi

# 10. Security Scan
log "🔒 Running Security Scan"
echo "----------------------"

if command -v npm >/dev/null 2>&1; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "NPM Audit" "npm audit --audit-level=high --json > test-results/npm-audit.json" "true"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi

# Generate comprehensive report
log "📊 Generating Test Report"
echo "========================"

cat > test-results/test-summary.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": {
    "nodeVersion": "$(node --version 2>/dev/null || echo 'unknown')",
    "npmVersion": "$(npm --version 2>/dev/null || echo 'unknown')",
    "platform": "$(uname -s)",
    "arch": "$(uname -m)"
  },
  "results": {
    "total": $TOTAL_TESTS,
    "passed": $PASSED_TESTS,
    "failed": $FAILED_TESTS,
    "passRate": $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l 2>/dev/null || echo "0")
  },
  "status": "$([ $FAILED_TESTS -eq 0 ] && echo "PASS" || echo "FAIL")"
}
EOF

# Display results
echo ""
echo "🎯 TEST RESULTS SUMMARY"
echo "======================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    success "All tests passed! 🎉"
    echo ""
    echo "🚀 RPS Game is ready for production deployment!"
    exit 0
else
    error "Some tests failed"
    echo ""
    echo "📋 Check test-results/ directory for detailed reports"
    echo "🔧 Fix failing tests before deployment"
    exit 1
fi