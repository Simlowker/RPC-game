#!/bin/bash

# RPS Game - Comprehensive Testing Script
# This script runs all testing categories and generates a comprehensive report

set -e  # Exit on any error

echo "🚀 STARTING COMPREHENSIVE TEST SUITE"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
TEST_RESULTS=()

# Function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local required="$3"  # "required" for critical tests, "optional" for others
    
    echo -e "\n${BLUE}📋 Running: $test_name${NC}"
    echo "Command: $test_command"
    echo "----------------------------------------"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✅ $test_name")
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("❌ $test_name")
        
        if [ "$required" = "required" ]; then
            echo -e "${RED}💥 CRITICAL TEST FAILED - This must pass for MainNet deployment${NC}"
        fi
    fi
}

# Create test results directory
mkdir -p test-results

echo "📦 Installing dependencies..."
npm install
cd app && npm install && cd ..

echo -e "\n🧪 SMART CONTRACT TESTS"
echo "========================"

# Unit Tests (Critical)
run_test "Smart Contract Unit Tests" \
    "npm run test:unit" \
    "required"

# Integration Tests (Critical)
run_test "Smart Contract Integration Tests" \
    "npm run test:integration" \
    "required"

# Security Tests (Critical)
run_test "Security & Vulnerability Tests" \
    "npm run test:security" \
    "required"

# Performance Tests (Critical)
run_test "Performance & Load Tests" \
    "npm run test:performance" \
    "required"

# End-to-End Tests (Critical)
run_test "End-to-End User Journey Tests" \
    "npm run test:e2e" \
    "required"

# Validation Suite (Critical)
run_test "MainNet Validation Suite" \
    "npm run test:validation" \
    "required"

echo -e "\n🎨 FRONTEND TESTS"
echo "================="

# Frontend Unit Tests
run_test "Frontend Component Tests" \
    "cd app && npm run test" \
    "required"

# Frontend Coverage
run_test "Frontend Test Coverage" \
    "cd app && npm run test:coverage" \
    "optional"

echo -e "\n🏗️ BUILD & DEPLOYMENT TESTS"
echo "============================"

# Smart Contract Build
run_test "Smart Contract Build" \
    "anchor build" \
    "required"

# Frontend Build
run_test "Frontend Build" \
    "cd app && npm run build" \
    "required"

# Linting
run_test "Code Linting" \
    "npm run lint" \
    "optional"

echo -e "\n📊 GENERATING COMPREHENSIVE REPORT"
echo "=================================="

# Generate test report
REPORT_FILE="test-results/comprehensive-test-report.json"
cat > "$REPORT_FILE" << EOF
{
  "testSuite": "RPS Game Comprehensive Testing",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "test",
  "summary": {
    "totalTests": $TOTAL_TESTS,
    "passedTests": $PASSED_TESTS,
    "failedTests": $FAILED_TESTS,
    "successRate": $(echo "scale=4; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l),
    "mainnetReady": $([ $FAILED_TESTS -eq 0 ] && echo "true" || echo "false")
  },
  "categories": {
    "smartContract": {
      "unit": "$(echo "${TEST_RESULTS[0]}" | grep -q "✅" && echo "passed" || echo "failed")",
      "integration": "$(echo "${TEST_RESULTS[1]}" | grep -q "✅" && echo "passed" || echo "failed")",
      "security": "$(echo "${TEST_RESULTS[2]}" | grep -q "✅" && echo "passed" || echo "failed")",
      "performance": "$(echo "${TEST_RESULTS[3]}" | grep -q "✅" && echo "passed" || echo "failed")",
      "e2e": "$(echo "${TEST_RESULTS[4]}" | grep -q "✅" && echo "passed" || echo "failed")",
      "validation": "$(echo "${TEST_RESULTS[5]}" | grep -q "✅" && echo "passed" || echo "failed")"
    },
    "frontend": {
      "components": "$(echo "${TEST_RESULTS[6]}" | grep -q "✅" && echo "passed" || echo "failed")",
      "coverage": "$(echo "${TEST_RESULTS[7]}" | grep -q "✅" && echo "passed" || echo "failed")"
    },
    "build": {
      "smartContract": "$(echo "${TEST_RESULTS[8]}" | grep -q "✅" && echo "passed" || echo "failed")",
      "frontend": "$(echo "${TEST_RESULTS[9]}" | grep -q "✅" && echo "passed" || echo "failed")",
      "linting": "$(echo "${TEST_RESULTS[10]}" | grep -q "✅" && echo "passed" || echo "failed")"
    }
  },
  "detailedResults": [
$(printf '%s\n' "${TEST_RESULTS[@]}" | sed 's/.*/"&"/' | paste -sd ',' -)
  ]
}
EOF

# Generate human-readable report
HUMAN_REPORT="test-results/test-summary.txt"
cat > "$HUMAN_REPORT" << EOF
🚀 RPS GAME - COMPREHENSIVE TEST RESULTS
========================================

📅 Test Date: $(date)
🌐 Environment: Test
📊 Total Tests: $TOTAL_TESTS
✅ Passed: $PASSED_TESTS
❌ Failed: $FAILED_TESTS
📈 Success Rate: $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l)%

🎯 MAINNET READINESS: $([ $FAILED_TESTS -eq 0 ] && echo "🟢 READY" || echo "🔴 NOT READY")

📋 DETAILED RESULTS:
EOF

for result in "${TEST_RESULTS[@]}"; do
    echo "$result" >> "$HUMAN_REPORT"
done

echo -e "\n🏁 FINAL RESULTS"
echo "================"
echo -e "📊 Total Tests: $TOTAL_TESTS"
echo -e "✅ Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "❌ Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "📈 Success Rate: $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l)%"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}ALL TESTS PASSED! 🟢 MAINNET READY${NC}"
    exit 0
else
    echo -e "\n⚠️  ${RED}SOME TESTS FAILED! 🔴 NOT READY FOR MAINNET${NC}"
    echo -e "\n📋 Failed Tests:"
    for result in "${TEST_RESULTS[@]}"; do
        if [[ $result == ❌* ]]; then
            echo -e "  ${RED}$result${NC}"
        fi
    done
    echo -e "\n🔧 Please fix failing tests before MainNet deployment"
    exit 1
fi