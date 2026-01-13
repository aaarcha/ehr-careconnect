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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify user has staff role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleData?.role !== 'staff') {
      return new Response(JSON.stringify({ error: 'Staff role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { email, redirectTo } = await req.json()

    // Validate email format (must be a CareConnect email)
    const allowedEmailPattern = /^[a-z0-9_]+@careconnect\.com$/i
    if (!email || !allowedEmailPattern.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid CareConnect email format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if the user exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    const targetUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found with this email' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Use admin API to generate recovery link
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: redirectTo || `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/auth?mode=reset`
      }
    })

    if (error) {
      console.error('Error generating recovery link:', error)
      throw error
    }

    console.log('Recovery link generated for:', email)

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Password reset email sent successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Error in send-password-reset:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to send reset email' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
