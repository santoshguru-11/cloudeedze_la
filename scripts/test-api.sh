#!/bin/bash

# Test script for credentials API
# This tests the full flow: login → add credentials

BASE_URL="http://localhost:3000"
COOKIE_FILE="/tmp/cloudedze-test-cookies.txt"

echo "=== Testing CloudEdze Credentials API ==="
echo ""

# Step 1: Login
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_FILE" -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "santosh@xyz.com",
    "password": "your-password-here"
  }')

echo "Login response: $LOGIN_RESPONSE"
echo ""

# Step 2: Check authentication
echo "2. Checking authentication..."
AUTH_RESPONSE=$(curl -s -b "$COOKIE_FILE" "$BASE_URL/api/auth/user")
echo "Auth response: $AUTH_RESPONSE"
echo ""

# Step 3: Get existing credentials
echo "3. Getting existing credentials..."
CREDS_RESPONSE=$(curl -s -b "$COOKIE_FILE" "$BASE_URL/api/credentials")
echo "Credentials response: $CREDS_RESPONSE"
echo ""

# Step 4: Add new credential
echo "4. Adding new credential..."
ADD_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X POST "$BASE_URL/api/credentials" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "oci",
    "name": "test-credentials",
    "encryptedCredentials": "{\"tenancyId\":\"test\",\"userId\":\"test\",\"fingerprint\":\"test\",\"privateKey\":\"test\",\"region\":\"us-phoenix-1\"}"
  }')

echo "Add credential response: $ADD_RESPONSE"
echo ""

# Cleanup
rm -f "$COOKIE_FILE"

echo "=== Test complete ==="
