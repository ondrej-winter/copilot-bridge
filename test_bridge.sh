#!/bin/bash
# Test script for Copilot Bridge

echo "======================================================================"
echo "Copilot Bridge - Test Suite"
echo "======================================================================"
echo ""

# Configuration
BASE_URL="http://127.0.0.1:32123"
ENDPOINT="${BASE_URL}/v1/chat"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local expected_status="$2"
    local curl_args="${@:3}"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo "Test ${TESTS_RUN}: ${test_name}"
    echo "----------------------------------------------------------------------"
    
    # Run curl and capture both status code and response
    response=$(eval "curl -w '\n%{http_code}' -s ${curl_args}")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "Status Code: ${status_code}"
    echo "Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected ${expected_status}, got ${status_code})"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
}

# Check if server is running
echo "Checking if Copilot Bridge is running..."
if ! curl -s -f -o /dev/null "${BASE_URL}/v1/chat" 2>/dev/null; then
    echo -e "${RED}ERROR: Copilot Bridge server is not running!${NC}"
    echo ""
    echo "Please start the bridge first:"
    echo "1. In the Extension Development Host window (the new VS Code window)"
    echo "2. Press Cmd+Shift+P"
    echo "3. Run: 'Copilot Bridge: Start'"
    echo "4. Wait for the notification confirming the server started"
    echo "5. Then run this test script again"
    exit 1
fi

echo -e "${GREEN}✓ Server is running${NC}"
echo ""
echo "======================================================================"
echo "Running Tests"
echo "======================================================================"
echo ""

# Test 1: Simple valid request
run_test "Simple valid request" 200 \
    "${ENDPOINT}" \
    -X POST \
    -H "'Content-Type: application/json'" \
    -d "'{\"messages\": [{\"role\": \"user\", \"content\": \"Say hello in one word\"}]}'"

# Test 2: Request with system message
run_test "Request with system message" 200 \
    "${ENDPOINT}" \
    -X POST \
    -H "'Content-Type: application/json'" \
    -d "'{\"messages\": [{\"role\": \"system\", \"content\": \"You are concise.\"}, {\"role\": \"user\", \"content\": \"What is 2+2?\"}]}'"

# Test 3: Invalid JSON
run_test "Invalid JSON payload" 400 \
    "${ENDPOINT}" \
    -X POST \
    -H "'Content-Type: application/json'" \
    -d "'{invalid json}'"

# Test 4: Missing messages
run_test "Missing messages field" 400 \
    "${ENDPOINT}" \
    -X POST \
    -H "'Content-Type: application/json'" \
    -d "'{}'"

# Test 5: Empty messages array
run_test "Empty messages array" 400 \
    "${ENDPOINT}" \
    -X POST \
    -H "'Content-Type: application/json'" \
    -d "'{\"messages\": []}'"

# Test 6: Invalid message role
run_test "Invalid message role" 400 \
    "${ENDPOINT}" \
    -X POST \
    -H "'Content-Type: application/json'" \
    -d "'{\"messages\": [{\"role\": \"invalid\", \"content\": \"test\"}]}'"

# Test 7: Unknown endpoint
run_test "Unknown endpoint (404)" 404 \
    "${BASE_URL}/unknown" \
    -X POST \
    -H "'Content-Type: application/json'" \
    -d "'{\"messages\": [{\"role\": \"user\", \"content\": \"test\"}]}'"

# Test 8: OPTIONS request (CORS preflight)
run_test "OPTIONS request (CORS)" 204 \
    "${ENDPOINT}" \
    -X OPTIONS

echo "======================================================================"
echo "Test Summary"
echo "======================================================================"
echo "Total tests run: ${TESTS_RUN}"
echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"
else
    echo -e "${GREEN}Failed: ${TESTS_FAILED}${NC}"
fi
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
