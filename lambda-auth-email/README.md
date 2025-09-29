# Auth Email Lambda Function

This Lambda function handles sending authentication emails (activation, password reset, etc.) via AWS SES.

## Environment Variables

Set these in your Lambda function configuration:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AUTH_FROM_EMAIL=noreply@raynsecure.com
NOTIFICATIONS_FROM_EMAIL=notifications@raynsecure.com
```

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Create deployment package:
```bash
zip -r auth-email-lambda.zip .
```

3. Deploy to AWS Lambda:
```bash
aws lambda create-function \
  --function-name auth-email-sender \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://auth-email-lambda.zip
```

## Usage

The function expects a POST request with the following body:

```json
{
  "to": "user@example.com",
  "subject": "Activate Your Account",
  "html": "<html>...</html>",
  "template": "auth"
}
```

## Response

Success response:
```json
{
  "success": true,
  "messageId": "0000014a-f4d4-4f4f-8f4f-000000000000",
  "message": "Email sent successfully"
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```
