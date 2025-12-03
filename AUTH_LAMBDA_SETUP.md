# Auth Lambda Setup Guide

## Overview

This guide explains how to set up the Auth Lambda function for sending authentication emails via AWS SES, replacing the Resend implementation.

## Prerequisites

- AWS account with SES configured
- Lambda function deployed (see `lambda-auth-email/README.md`)
- Supabase project with Edge Functions

## Step 1: Deploy Lambda Function

1. **Navigate to the Lambda directory:**
   ```bash
   cd lambda-auth-email
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Deploy to AWS Lambda:**
   ```bash
   # Create deployment package
   zip -r auth-email-lambda.zip .
   
   # Deploy to AWS (replace YOUR_ACCOUNT with your AWS account ID)
   aws lambda create-function \
     --function-name auth-email-sender \
     --runtime nodejs18.x \
     --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
     --handler index.handler \
     --zip-file fileb://auth-email-lambda.zip
   ```

## Step 2: Configure Lambda Environment Variables

In AWS Lambda Console:

1. Go to your `auth-email-sender` function
2. Go to Configuration → Environment variables
3. Add these variables:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AUTH_FROM_EMAIL=noreply@raynsecure.com
NOTIFICATIONS_FROM_EMAIL=notifications@raynsecure.com
```

## Step 3: Get Lambda URL

1. In AWS Lambda Console, go to your function
2. Go to Configuration → Function URL
3. Create a function URL if it doesn't exist
4. Copy the URL (it will look like: `https://abc123.lambda-url.us-east-1.on.aws/`)

## Step 4: Update Supabase Secrets

1. Go to your Supabase project dashboard
2. Go to Settings → Edge Functions
3. Go to Secrets tab
4. Add a new secret:
   - **Name:** `AUTH_LAMBDA_URL`
   - **Value:** Your Lambda function URL (from Step 3)

## Step 5: Test the Integration

1. **Test Lambda function directly:**
   ```bash
   curl -X POST https://your-lambda-url.lambda-url.us-east-1.on.aws/ \
     -H "Content-Type: application/json" \
     -d '{
       "to": "test@example.com",
       "subject": "Test Email",
       "html": "<h1>Test</h1>",
       "template": "auth"
     }'
   ```

2. **Test through Supabase Edge Function:**
   - Go to your app
   - Try to create a new user
   - Check if activation email is sent

## Step 6: Fallback Configuration

If you need to switch back to Resend:

1. Go to Supabase Edge Functions
2. Edit `send-email` function
3. Comment out the Lambda code (lines 117-201)
4. Uncomment the Resend code (lines 30-115)
5. Deploy the function

## Troubleshooting

### Common Issues:

1. **"Auth Lambda service not configured"**
   - Check that `AUTH_LAMBDA_URL` is set in Supabase secrets
   - Verify the URL is correct and accessible

2. **"Failed to send email via Lambda"**
   - Check Lambda function logs in AWS CloudWatch
   - Verify AWS credentials are correct
   - Ensure SES is configured properly

3. **"Email address not verified"**
   - Verify your from email address in AWS SES
   - Check if you're in SES sandbox mode

### Monitoring:

- **Lambda Logs:** AWS CloudWatch → Log groups → `/aws/lambda/auth-email-sender`
- **Supabase Logs:** Supabase Dashboard → Edge Functions → Logs
- **SES Metrics:** AWS SES Console → Sending statistics

## Security Notes

- Never commit AWS credentials to code
- Use IAM roles in production
- Rotate access keys regularly
- Monitor SES usage and costs
- Set up CloudWatch alarms for failures
