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
    // Extract base URL from request headers
    const origin = req.headers.get('origin') || 
                   req.headers.get('referer')?.replace(/\/.*$/, '') || 
                   'http://localhost:3000';
    
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
          status: 86, 
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
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #02757F; margin: 0; padding: 0; background-color: #f0f9f8; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #359D8A 0%, #026473 100%); padding: 20px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 20px 30px; }
            .content h2 { color: #02757F; margin: 0 0 15px 0; font-size: 22px; }
            .content p { color: #868686; margin: 0 0 15px 0; font-size: 16px; }
            .button { 
                display: inline-block; 
                background: linear-gradient(135deg, #359D8A 0%, #026473 100%); 
                color: white !important; 
                text-decoration: none !important; 
                padding: 18px 36px; 
                border-radius: 8px; 
                font-weight: 600; 
                font-size: 16px; 
                margin: 15px 0; 
                box-shadow: 0 4px 12px rgba(53, 157, 138, 0.3);
                border: none;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
                min-width: 200px;
                line-height: 1.2;
                vertical-align: middle;
            }
            .button:hover { 
                opacity: 0.9; 
                box-shadow: 0 6px 16px rgba(53, 157, 138, 0.4);
                transform: translateY(-1px);
            }
            .footer { background: #f0f9f8; padding: 20px; text-align: center; border-top: 1px solid #67C171; }
            .footer p { color: #868686; font-size: 14px; margin: 0; }
            .logo { width: 60px; height: 60px; margin: 0 auto 10px; display: block; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://44485296.fs1.hubspotusercontent-na2.net/hubfs/44485296/RAYN%20logos/RAYN%20Logo%203D%20Transparent.png" alt="RAYN Secure Logo" class="logo" />
                <h1>RAYN Secure</h1>
            </div>
            <div class="content">
                ${html}
            </div>
            <div class="footer">
                <p>You're receiving this email because you're enrolled in a learning track.</p>
                <p><a href="${origin}/settings/notifications" style="color: #02757F; text-decoration: underline;">Manage notification preferences</a></p>
                <p>© ${new Date().getFullYear()} RAYN Secure Pte Ltd. All rights reserved.</p>
                <p>This email was sent from RAYN Secure Pte Ltd.</p>
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

  } catch (err) {
    console.error('Send email error:', err);
    const details = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
