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

    const { email, password } = await req.json()
    console.log('Email:', email)

    if (email !== 'staff001@careconnect.com') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // List all users and check if staff email exists
    console.log('Listing all users...')
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })
    
    if (listError) {
      console.error('Error listing users:', listError)
      throw listError
    }
    
    const allUsers = usersData?.users || []
    console.log('Total users:', allUsers.length)
    allUsers.forEach(u => console.log('User:', u.id, u.email))
    
    const existingUser = allUsers.find(u => u.email === email)
    console.log('Existing user found:', !!existingUser, existingUser?.id)

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
      
      console.log('Password updated successfully')

      // Ensure user_role exists
      const { error: roleError } = await supabaseAdmin.from('user_roles').upsert({
        user_id: existingUser.id,
        role: 'staff',
        account_number: 'STAFF001'
      }, { onConflict: 'user_id' })
      
      if (roleError) {
        console.error('Error upserting role:', roleError)
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Password updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // User doesn't exist in listUsers but might exist with issues
      // Try to delete by iterating and finding similar emails, then create fresh
      console.log('User not found in list, attempting to create...')
      
      // First try to create - if it fails with duplicate, we know it exists somewhere
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })
      
      if (createError) {
        console.error('Error creating user:', createError.message)
        
        // If duplicate error, try to find and delete the problematic user
        if (createError.message.includes('duplicate') || createError.message.includes('already')) {
          console.log('Duplicate detected, trying alternative approach...')
          
          // Try inviting the user instead (this might work around the issue)
          const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
          
          if (inviteError) {
            console.error('Invite also failed:', inviteError)
            throw createError // Throw the original error
          }
          
          return new Response(
            JSON.stringify({ success: true, message: 'User invited, please check email' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        throw createError
      }
      
      console.log('User created:', newUser?.user?.id)

      // Create user_role
      const { error: roleError } = await supabaseAdmin.from('user_roles').upsert({
        user_id: newUser.user.id,
        role: 'staff',
        account_number: 'STAFF001'
      }, { onConflict: 'user_id' })
      
      if (roleError) {
        console.error('Error creating role:', roleError)
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
