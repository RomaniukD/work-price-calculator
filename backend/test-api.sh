#!/bin/bash

# API Test Commands

echo "=== Testing Price Counter Backend API ==="
echo ""

# Test 1: Health check
echo "1. Health Check"
echo "curl http://localhost:3000/api/health"
curl http://localhost:3000/api/health
echo -e "\n"

# Test 2: Load demo data
echo "2. Load Demo Data"
echo "curl -X POST http://localhost:3000/api/update-prices-demo"
curl -X POST http://localhost:3000/api/update-prices-demo
echo -e "\n"

# Test 3: Get all categories
echo "3. Get All Categories"
echo "curl http://localhost:3000/api/categories"
curl http://localhost:3000/api/categories | jq .
echo -e "\n"

# Test 4: Update prices from source (requires real URL)
echo "4. Update Prices from Source URL (would need real URL)"
echo 'curl -X POST http://localhost:3000/api/update-prices \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"sourceUrl":"https://example.com/prices"}'"'"

echo -e "\n=== All tests completed ==="
