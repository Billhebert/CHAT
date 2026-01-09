#!/bin/bash

# ==============================================================================
# Authentication Test Script
# ==============================================================================
# This script demonstrates the difference between TENANT and USER API keys
# and shows how to properly authenticate to create chats.
# ==============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000"

echo "======================================================================"
echo "Multi-Tenant AI Chat Platform - Authentication Test"
echo "======================================================================"
echo ""

# First, we need to get the API keys from the database
echo "📋 Step 1: Getting API keys from database..."
echo ""

# Query the database for tenant and user API keys
TENANT_API_KEY=$(docker exec chat-postgres psql -U chatuser -d chat_platform -t -c "SELECT api_key FROM \"Tenant\" LIMIT 1;" | xargs)
USER_API_KEY=$(docker exec chat-postgres psql -U chatuser -d chat_platform -t -c "SELECT api_key FROM \"User\" LIMIT 1;" | xargs)

if [ -z "$TENANT_API_KEY" ] || [ -z "$USER_API_KEY" ]; then
    echo -e "${RED}❌ Error: API keys not found in database${NC}"
    echo "Please run the setup script first:"
    echo "  npm run setup"
    exit 1
fi

echo -e "${GREEN}✅ Found API keys${NC}"
echo "  Tenant API Key: ${TENANT_API_KEY:0:10}..."
echo "  User API Key: ${USER_API_KEY:0:10}..."
echo ""

# ==============================================================================
# TEST 1: Authenticate with TENANT API Key (WILL FAIL to create chat)
# ==============================================================================
echo "======================================================================"
echo "TEST 1: Using TENANT API Key"
echo "======================================================================"
echo ""
echo -e "${YELLOW}⚠️  TENANT API keys are for server-to-server communication${NC}"
echo -e "${YELLOW}⚠️  They don't have user context (userId is undefined)${NC}"
echo ""

echo "📤 Requesting JWT token with TENANT API key..."
TENANT_TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/token" \
  -H "Content-Type: application/json" \
  -d "{
    \"apiKey\": \"$TENANT_API_KEY\",
    \"grantType\": \"api_key\"
  }")

TENANT_ACCESS_TOKEN=$(echo $TENANT_TOKEN_RESPONSE | jq -r '.accessToken')

if [ "$TENANT_ACCESS_TOKEN" != "null" ] && [ -n "$TENANT_ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✅ JWT token obtained${NC}"
    echo ""

    echo "📤 Attempting to create a chat with TENANT token..."
    TENANT_CHAT_RESPONSE=$(curl -s -X POST "$API_URL/api/chats" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TENANT_ACCESS_TOKEN" \
      -d '{
        "title": "Test Chat with Tenant Key"
      }')

    if echo "$TENANT_CHAT_RESPONSE" | grep -q "TENANT API key"; then
        echo -e "${RED}❌ FAILED (as expected)${NC}"
        echo "Error message:"
        echo "$TENANT_CHAT_RESPONSE" | jq -r '.error' | sed 's/^/  /'
    else
        echo -e "${RED}❌ Unexpected response${NC}"
        echo "$TENANT_CHAT_RESPONSE" | jq '.'
    fi
else
    echo -e "${RED}❌ Failed to get token${NC}"
    echo "$TENANT_TOKEN_RESPONSE" | jq '.'
fi

echo ""
echo ""

# ==============================================================================
# TEST 2: Authenticate with USER API Key (WILL SUCCEED)
# ==============================================================================
echo "======================================================================"
echo "TEST 2: Using USER API Key"
echo "======================================================================"
echo ""
echo -e "${GREEN}✅ USER API keys have full user context${NC}"
echo -e "${GREEN}✅ They include userId, roles, department, etc.${NC}"
echo ""

echo "📤 Requesting JWT token with USER API key..."
USER_TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/token" \
  -H "Content-Type: application/json" \
  -d "{
    \"apiKey\": \"$USER_API_KEY\",
    \"grantType\": \"api_key\"
  }")

USER_ACCESS_TOKEN=$(echo $USER_TOKEN_RESPONSE | jq -r '.accessToken')

if [ "$USER_ACCESS_TOKEN" != "null" ] && [ -n "$USER_ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✅ JWT token obtained${NC}"
    echo ""

    echo "📤 Creating a chat with USER token..."
    USER_CHAT_RESPONSE=$(curl -s -X POST "$API_URL/api/chats" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
      -d '{
        "title": "Test Chat with User Key",
        "systemPrompt": "You are a helpful assistant."
      }')

    if echo "$USER_CHAT_RESPONSE" | grep -q '"chat"'; then
        echo -e "${GREEN}✅ SUCCESS! Chat created${NC}"
        CHAT_ID=$(echo "$USER_CHAT_RESPONSE" | jq -r '.chat.id')
        echo "Chat ID: $CHAT_ID"
        echo ""
        echo "Chat details:"
        echo "$USER_CHAT_RESPONSE" | jq '.chat'
    else
        echo -e "${RED}❌ Failed to create chat${NC}"
        echo "$USER_CHAT_RESPONSE" | jq '.'
    fi
else
    echo -e "${RED}❌ Failed to get token${NC}"
    echo "$USER_TOKEN_RESPONSE" | jq '.'
fi

echo ""
echo ""

# ==============================================================================
# Summary
# ==============================================================================
echo "======================================================================"
echo "SUMMARY"
echo "======================================================================"
echo ""
echo "Key Differences:"
echo ""
echo "1. TENANT API KEY:"
echo "   - Used for server-to-server communication"
echo "   - No user context (userId = undefined)"
echo "   - Cannot create chats or perform user-specific actions"
echo "   - Example: sk_tenant_xxx..."
echo ""
echo "2. USER API KEY:"
echo "   - Used for user authentication"
echo "   - Full user context (userId, roles, department, etc.)"
echo "   - Can create chats and perform all user actions"
echo "   - Example: sk_user_xxx..."
echo ""
echo -e "${YELLOW}💡 Solution: Always use USER API keys for frontend authentication!${NC}"
echo ""
