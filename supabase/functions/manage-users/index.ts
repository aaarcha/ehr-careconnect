import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserCreateRequest {
  role: 'staff' | 'doctor' | 'medtech' | 'radtech' | 'patient';
  name: string;
  accountNumber: string;
  password: string;
  linkedId?: string; // For linking to existing patient/doctor records
  specialty?: string; // For doctors
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting manage-users function')
    
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

    // Verify user has staff role (only staff can manage users)
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

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // GET: List all users by role
    if (req.method === 'GET') {
      const roleFilter = url.searchParams.get('role')
      
      let query = supabaseAdmin.from('user_roles').select('*')
      if (roleFilter && roleFilter !== 'all') {
        query = query.eq('role', roleFilter)
      }
      
      const { data: users, error: usersError } = await query
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        throw usersError
      }

      // Enrich with names from respective tables
      const enrichedUsers = await Promise.all(users.map(async (u) => {
        let displayName = u.account_number || 'Unknown';
        
        if (u.role === 'medtech') {
          const { data: medtech } = await supabaseAdmin
            .from('medtechs')
            .select('name')
            .eq('user_id', u.user_id)
            .single()
          if (medtech) displayName = medtech.name;
        } else if (u.role === 'radtech') {
          const { data: radtech } = await supabaseAdmin
            .from('radtechs')
            .select('name')
            .eq('user_id', u.user_id)
            .single()
          if (radtech) displayName = radtech.name;
        } else if (u.role === 'doctor') {
          const { data: doctor } = await supabaseAdmin
            .from('doctors')
            .select('name')
            .eq('user_id', u.user_id)
            .single()
          if (doctor) displayName = doctor.name;
        } else if (u.role === 'patient') {
          const { data: patient } = await supabaseAdmin
            .from('patients')
            .select('name')
            .eq('user_id', u.user_id)
            .single()
          if (patient) displayName = patient.name;
        }
        
        return { ...u, display_name: displayName }
      }))

      return new Response(
        JSON.stringify({ users: enrichedUsers }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST: Create or update user
    if (req.method === 'POST') {
      const body: UserCreateRequest = await req.json()
      const { role, name, accountNumber, password, linkedId, specialty } = body

      console.log('Creating/updating user:', { role, name, accountNumber })

      // Validate inputs
      if (!role || !name || !accountNumber || !password) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: role, name, accountNumber, password' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (password.length < 8) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 8 characters long.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate email from account number
      const email = `${accountNumber.toLowerCase().trim()}@careconnect.com`
      
      // Check if user already exists
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const existingUser = usersData?.users?.find(u => u.email === email)

      let userId: string;

      if (existingUser) {
        // Update existing user's password
        console.log('Updating password for existing user:', existingUser.id)
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { password }
        )
        if (updateError) throw updateError
        userId = existingUser.id
      } else {
        // Create new user
        console.log('Creating new user with email:', email)
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        })
        if (createError) throw createError
        userId = newUser.user.id
      }

      // Upsert user_role
      const { error: roleUpsertError } = await supabaseAdmin.from('user_roles').upsert({
        user_id: userId,
        role: role,
        account_number: accountNumber.toUpperCase(),
        patient_number: role === 'patient' ? accountNumber.toUpperCase() : null
      }, { onConflict: 'user_id' })
      
      if (roleUpsertError) {
        console.error('Error upserting role:', roleUpsertError)
      }

      // Link to respective table based on role
      if (role === 'doctor') {
        if (linkedId) {
          // Update existing doctor record
          await supabaseAdmin.from('doctors').update({
            user_id: userId,
            account_number: accountNumber.toUpperCase()
          }).eq('id', linkedId)
        } else {
          // Create new doctor record
          await supabaseAdmin.from('doctors').insert({
            name,
            specialty: specialty || 'General Practice',
            user_id: userId,
            account_number: accountNumber.toUpperCase()
          })
        }
      } else if (role === 'medtech') {
        if (linkedId) {
          await supabaseAdmin.from('medtechs').update({
            user_id: userId
          }).eq('id', linkedId)
        } else {
          await supabaseAdmin.from('medtechs').insert({
            name,
            account_number: accountNumber.toUpperCase(),
            user_id: userId
          })
        }
      } else if (role === 'radtech') {
        if (linkedId) {
          await supabaseAdmin.from('radtechs').update({
            user_id: userId
          }).eq('id', linkedId)
        } else {
          await supabaseAdmin.from('radtechs').insert({
            name,
            account_number: accountNumber.toUpperCase(),
            user_id: userId
          })
        }
      } else if (role === 'patient' && linkedId) {
        // Link to existing patient record
        await supabaseAdmin.from('patients').update({
          user_id: userId
        }).eq('id', linkedId)
      }

      console.log('User created/updated successfully:', userId)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: existingUser ? 'User updated' : 'User created',
          userId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE: Remove user account (but keep linked records)
    if (req.method === 'DELETE') {
      const { userId: targetUserId } = await req.json()
      
      if (!targetUserId) {
        return new Response(
          JSON.stringify({ error: 'userId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Don't allow deleting yourself
      if (targetUserId === user.id) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete your own account' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Delete the auth user (cascade will handle user_roles)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
      
      if (deleteError) throw deleteError

      return new Response(
        JSON.stringify({ success: true, message: 'User deleted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Caught error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
