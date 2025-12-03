const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'ap-southeast-1',
});

exports.handler = async (event) => {
  console.log('Auth Lambda received event:', JSON.stringify(event, null, 2));

  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    const { to, subject, html, template } = body;

    // Validate required fields
    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: to, subject, html',
        }),
      };
    }

    // Use the configured from email
    const fromEmail = process.env.SES_FROM_EMAIL || 'team@raynsecure.com';

    console.log(`Sending ${template || 'email'} to: ${to}`);

    // Create the email command
    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
        },
      },
    });

    // Send the email
    const response = await sesClient.send(command);
    console.log('Email sent successfully:', response.MessageId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        messageId: response.MessageId,
        message: 'Email sent successfully',
      }),
    };

  } catch (error) {
    console.error('Error sending email:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to send email',
        details: error.toString(),
      }),
    };
  }
};
