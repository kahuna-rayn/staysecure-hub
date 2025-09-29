import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteUserRequest {
  userId: string;
  reason?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the current user to verify they are an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authorization token');
    }

    // Verify admin permissions
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole || !['super_admin', 'client_admin'].includes(userRole.role)) {
      throw new Error('Insufficient permissions. Admin access required.');
    }

    // Parse request body
    const { userId, reason }: DeleteUserRequest = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Don't allow admins to delete themselves
    if (userId === user.id) {
      throw new Error('Cannot delete your own account');
    }

    console.log(`Admin ${user.id} attempting to delete user ${userId}`);

    // Get user details before deletion for audit trail
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, username')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw new Error('User not found');
    }

    // Get user email from auth.users
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (authUserError) {
      console.error('Error fetching auth user:', authUserError);
      throw new Error('User not found in auth system');
    }

    console.log(`Deleting user: ${userProfile.full_name} (${authUser.user.email})`);

    // Create audit record before deletion
    const { error: auditError } = await supabaseAdmin
      .from('user_deletion_audit')
      .insert({
        deleted_user_name: userProfile.full_name || 'Unknown',
        deleted_user_email: authUser.user.email || '',
        deleted_user_id: userId,
        deleted_by: user.id,
        deletion_reason: reason || null
      });

    if (auditError) {
      console.error('Error creating audit record:', auditError);
      throw new Error('Failed to create audit record');
    }

    // Delete related records first to avoid foreign key constraints
    console.log('Deleting related user records...');
    
    // Detach account_inventory records (retain history)
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { error: invUpdateError } = await supabaseAdmin
        .from('account_inventory')
        .update({ user_id: null, status: 'Inactive', date_access_revoked: today })
        .eq('user_id', userId);
      if (invUpdateError) {
        console.warn('Warning: Could not nullify account_inventory.user_id:', invUpdateError);
      } else {
        console.log('✅ Detached account_inventory references');
      }
    } catch (e) {
      console.warn('Warning: Exception nullifying account_inventory.user_id:', e);
    }

    // Delete from tables that reference user_id
    const tablesToCleanup = [
      'user_roles',
      'user_departments', 
      'user_profile_roles',
      'user_learning_track_progress',
      'user_lesson_progress',
      'physical_location_access',
      'learning_track_assignments',
      'document_assignments',
      'certificates',
      'hardware',
      'quiz_attempts',
      'user_answer_responses',
      'user_behavior_analytics',
      'breach_team_members',
      'account_inventory',
      'hib_checklist',
      'hib_results',
      'csba_answers',
      'document_users',
      'email_notifications',
      'email_preferences',
      'product_license_assignments',
      'user_phishing_scores'
    ];

    for (const table of tablesToCleanup) {
      try {
        const { error: cleanupError } = await supabaseAdmin
          .from(table)
          .delete()
          .eq('user_id', userId);
        
        if (cleanupError) {
          console.warn(`Warning: Could not clean up table ${table}:`, cleanupError);
          // Continue with deletion even if some cleanup fails
        } else {
          console.log(`✅ Cleaned up table: ${table}`);
        }
      } catch (e) {
        console.warn(`Warning: Exception cleaning up table ${table}:`, e);
        // Continue with deletion
      }
    }

    // Delete user from auth.users (this will cascade to profiles table due to foreign key)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError);
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }

    console.log(`Successfully deleted user ${userId} by admin ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${userProfile.full_name} has been successfully deleted`,
        deletedUser: {
          name: userProfile.full_name,
          email: authUser.user.email
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Delete user error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});