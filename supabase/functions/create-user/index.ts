import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { 
      email, 
      password, 
      full_name, 
      first_name, 
      last_name, 
      username, 
      phone, 
      location, 
      location_id, 
      status, 
      access_level, 
      bio, 
      employee_id 
    } = await req.json()

    console.log('Processing user creation request for email:', email)
    console.log('Full request data:', {
      email,
      full_name,
      first_name,
      last_name,
      username,
      phone,
      location,
      status,
      access_level,
      bio,
      employee_id
    })

    // Generate unique username if not provided or if duplicate
    let finalUsername = username
    if (!finalUsername || finalUsername.trim() === '') {
      // Generate username from email or name
      const baseUsername = email.split('@')[0] || 
        (full_name ? full_name.toLowerCase().replace(/\s+/g, '') : 'user')
      finalUsername = baseUsername
    }

    // Check if username exists and make it unique
    let attempts = 0
    let testUsername = finalUsername
    while (attempts < 10) {
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .eq('username', testUsername)
        .single()

      if (!existingUser) {
        finalUsername = testUsername
        break
      }
      
      attempts++
      testUsername = `${finalUsername}${attempts}`
    }

    // Generate unique employee ID if not provided
    let finalEmployeeId = employee_id
    if (!finalEmployeeId || finalEmployeeId.trim() === '') {
      const year = new Date().getFullYear()
      const dayOfYear = Math.floor((Date.now() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24))
      const randomId = Math.random().toString(36).substr(2, 6).toUpperCase()
      finalEmployeeId = `EMP-${year}-${dayOfYear.toString().padStart(3, '0')}-${randomId}`
    }

    // Map access_level to proper role for the system
    let mappedAccessLevel = access_level || 'User'
    
    // Ensure access_level matches what the UI expects
    if (mappedAccessLevel === 'Admin') {
      // Keep as 'Admin' for UI display, the trigger will map it to 'client_admin' role
      mappedAccessLevel = 'Admin'
    }

  // Create user without password (admin.createUser)
  const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    email_confirm: false, // Don't auto-confirm email
    user_metadata: {
      full_name,
      first_name,
      last_name,
      username: email,
      phone,
      location,
      location_id,
      status: status || 'Pending',
      access_level: mappedAccessLevel,
      bio,
      cyber_learner: true,
      employee_id: finalEmployeeId,
      requires_password_setup: true
    }
  })

  if (createUserError) {
    console.error('Auth user creation error:', createUserError)
    throw new Error(`Failed to create user: ${createUserError.message || 'Unknown error'}`)
  }

  const authUser = createUserData.user
  console.log(`User created: ${authUser.id}`)

  // Generate simple activation link
  const baseUrl = Deno.env.get('APP_BASE_URL') || 'http://localhost:8080'
  const activationLink = `${baseUrl}/activate-account?email=${encodeURIComponent(email)}&user_id=${authUser.id}`
  
  console.log('Generated activation link:', activationLink)
  
  // Send custom activation email
  try {
    console.log('Attempting to send email to:', email)
    console.log('Email URL:', `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`)
    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        to: email,
        subject: 'Activate Your Account',
        html: `
          <h2>Welcome to StaySecure Learn!</h2>
          <p>Please click the link below to activate your account and set your password:</p>
          <p><a href="${activationLink}">Activate Account</a></p>
          <p>If the link doesn't work, copy and paste this URL into your browser:</p>
          <p>${activationLink}</p>
        `
      })
    })

    console.log('Email response status:', emailResponse.status)
    const emailResult = await emailResponse.text()
    console.log('Email response body:', emailResult)
    
    if (emailResponse.ok) {
      console.log('Activation email sent successfully to:', email)
    } else {
      console.error('Failed to send activation email:', emailResult)
    }
  } catch (emailError) {
    console.error('Activation email error:', emailError)
    console.error('Email error details:', JSON.stringify(emailError, null, 2))
    // Don't fail the entire user creation for this
  }


    // Verify profile was created by the trigger with retries
    let profile = null
    let retryAttempts = 0
    const maxAttempts = 5
    
    while (!profile && retryAttempts < maxAttempts) {
      retryAttempts++
      console.log(`Checking for profile creation, attempt ${retryAttempts}...`)
      
      // Wait longer between retries
      await new Promise(resolve => setTimeout(resolve, 500 * retryAttempts))
      
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (profileError) {
        console.error(`Profile fetch error on attempt ${retryAttempts}:`, profileError)
        
        if (retryAttempts === maxAttempts) {
          // If we can't fetch the profile after max attempts, clean up and fail
          console.error('Max attempts reached, cleaning up auth user...')
          await supabaseAdmin.auth.admin.deleteUser(authUser.id)
          throw new Error(`Profile creation failed after ${maxAttempts} attempts: ${profileError.message}`)
        }
        continue
      }

      if (profileData) {
        profile = profileData
        console.log(`Profile found: ${profile.username}`)
        break
      }

      console.log(`Profile not found yet, retrying... (attempt ${retryAttempts}/${maxAttempts})`)
    }

    if (!profile) {
      console.error('Profile was not created by trigger, cleaning up auth user...')
      await supabaseAdmin.auth.admin.deleteUser(authUser.id)
      throw new Error('Profile creation failed: No profile found after trigger execution')
    }

    // Create account_inventory record to store email for profile display
    console.log('Creating account inventory record with email:', email)
    const { error: inventoryError } = await supabaseAdmin
      .from('account_inventory')
      .insert({
        user_id: authUser.id,
        full_name: full_name,
        username_email: email,
        status: 'Active',
        created_at: new Date().toISOString()
      })

    if (inventoryError) {
      console.error('Account inventory creation error:', inventoryError)
      // Don't fail the entire user creation for this
    } else {
      console.log('Account inventory record created successfully with email:', email)
    }

    return new Response(
      JSON.stringify({
        user: authUser,
        profile: profile
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Create user error:', error)
    
    return new Response(
      JSON.stringify({
        error: error?.message || 'Database error creating new user'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})