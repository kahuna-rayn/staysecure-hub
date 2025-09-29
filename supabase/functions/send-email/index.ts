import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html } = await req.json();
    
    console.log('Send email request:', { to, subject, html: html.substring(0, 100) + '...' });
    
    if (!to || !subject || !html) {
      console.error('Missing required fields:', { to, subject, hasHtml: !!html });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // RESEND CODE (COMMENTED OUT - UNCOMMENT TO SWITCH BACK TO RESEND)
    // Check if RESEND_API_KEY is available
    // const resendApiKey = Deno.env.get('RESEND_API_KEY');
    // if (!resendApiKey) {
    //   console.error('RESEND_API_KEY not found in environment variables');
    //   return new Response(
    //     JSON.stringify({ error: 'Email service not configured' }),
    //     { 
    //       status: 500, 
    //       headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    //     }
    //   );
    // }

    // console.log('Sending email via Resend API...');
    
    // // Use Resend API to send email
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${resendApiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     from: 'onboarding@resend.dev',
    //     to,
    //     subject,
    //     html
    //   })
    // });

    // const responseText = await response.text();
    // console.log('Resend API response status:', response.status);
    // console.log('Resend API response body:', responseText);

    // if (!response.ok) {
    //   console.error('Resend API error:', response.status, responseText);
    //   return new Response(
    //     JSON.stringify({ error: 'Failed to send email', details: responseText }),
    //     { 
    //       status: 500, 
    //       headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    //     }
    //   );
    // }

    // NEW LAMBDA + AWS SES APPROACH
    console.log('Sending email via Lambda + AWS SES...');
    
    // Check if Lambda URL is configured
    const lambdaUrl = Deno.env.get('AUTH_LAMBDA_URL');
    if (!lambdaUrl) {
      console.error('AUTH_LAMBDA_URL not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Auth Lambda service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create branded email template
    const brandedHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .content h2 { color: #1f2937; margin: 0 0 20px 0; font-size: 24px; }
            .content p { color: #6b7280; margin: 0 0 20px 0; font-size: 16px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
            .button:hover { opacity: 0.9; }
            .footer { background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer p { color: #9ca3af; font-size: 14px; margin: 0; }
            .logo { width: 40px; height: 40px; background: white; border-radius: 8px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #667eea; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">SL</div>
                <h1>StaySecure Learn</h1>
            </div>
            <div class="content">
                ${html}
            </div>
            <div class="footer">
                <p>© 2024 StaySecure Learn. All rights reserved.</p>
                <p>This email was sent from StaySecure Learn platform.</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    // Call Lambda function to send email via AWS SES
    const response = await fetch(lambdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        subject,
        html: brandedHtml,
        template: 'auth' // Specify this is an auth email
      })
    });

    const responseText = await response.text();
    console.log('Lambda response status:', response.status);
    console.log('Lambda response body:', responseText);

    if (!response.ok) {
      console.error('Lambda error:', response.status, responseText);
      return new Response(
        JSON.stringify({ error: 'Failed to send email via Lambda', details: responseText }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Email sent successfully to:', to);
    
    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Send email error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
