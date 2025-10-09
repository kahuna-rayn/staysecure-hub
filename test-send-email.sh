#!/bin/bash

# Test send-email Edge Function
# Replace YOUR_EMAIL with your actual email address

SUPABASE_URL="https://ufvingocbzegpgjknzhm.supabase.co"
# Get your anon key from Supabase Dashboard -> Settings -> API
SUPABASE_ANON_KEY="YOUR_ANON_KEY_HERE"

curl -X POST \
  "${SUPABASE_URL}/functions/v1/send-email" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "YOUR_EMAIL@example.com",
    "subject": "Test Email from RAYN Secure",
    "html": "<h2>Test Email</h2><p>This is a test email to verify the send-email function is working correctly.</p><p>If you received this, the email system is working! ✅</p>"
  }'

echo ""
echo "Check your email inbox for the test message"

