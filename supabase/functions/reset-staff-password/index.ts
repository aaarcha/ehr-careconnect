import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting reset-staff-password function')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const supabaseAdmin = createClient(
      supabaseUrl ?? '',
      serviceRoleKey ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      console.log('Invalid token or user not found:', authError?.message)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user has staff role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roleData?.role !== 'staff') {
      console.log('User does not have staff role:', roleError?.message || roleData?.role)
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Staff role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, password } = await req.json()
    console.log('Authenticated staff member requesting password reset for:', email)

    // Validate email format and allowed domains
    const allowedEmailPattern = /^[a-z0-9_]+@careconnect\.com$/i
    if (!email || !allowedEmailPattern.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format. Must be a valid CareConnect email.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate password strength
    if (!password || password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // List all users and check if target email exists
    console.log('Listing users to find target email...')
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })
    
    if (listError) {
      console.error('Error listing users:', listError)
      throw listError
    }
    
    const allUsers = usersData?.users || []
    const existingUser = allUsers.find(u => u.email === email)
    console.log('Target user found:', !!existingUser, existingUser?.id)

    if (existingUser) {
      console.log('Updating password for user:', existingUser.id)
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password }
      )
      
      if (updateError) {
        console.error('Error updating password:', updateError)
        throw updateError
      }
      
      console.log('Password updated successfully by staff member:', user.email)

      // Ensure user_role exists for the target user
      const { error: roleUpsertError } = await supabaseAdmin.from('user_roles').upsert({
        user_id: existingUser.id,
        role: 'staff',
        account_number: email.split('@')[0].toUpperCase()
      }, { onConflict: 'user_id' })
      
      if (roleUpsertError) {
        console.error('Error upserting role:', roleUpsertError)
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Password updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // User doesn't exist, create new user
      console.log('User not found, creating new account...')
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })
      
      if (createError) {
        console.error('Error creating user:', createError.message)
        
        if (createError.message.includes('duplicate') || createError.message.includes('already')) {
          console.log('Duplicate detected, trying invite approach...')
          
          const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
          
          if (inviteError) {
            console.error('Invite also failed:', inviteError)
            throw createError
          }
          
          return new Response(
            JSON.stringify({ success: true, message: 'User invited, please check email' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        throw createError
      }
      
      console.log('User created:', newUser?.user?.id)

      // Create user_role for new user
      const { error: roleCreateError } = await supabaseAdmin.from('user_roles').upsert({
        user_id: newUser.user.id,
        role: 'staff',
        account_number: email.split('@')[0].toUpperCase()
      }, { onConflict: 'user_id' })
      
      if (roleCreateError) {
        console.error('Error creating role:', roleCreateError)
      }

      return new Response(
        JSON.stringify({ success: true, message: 'User created' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error: unknown) {
    console.error('Caught error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
