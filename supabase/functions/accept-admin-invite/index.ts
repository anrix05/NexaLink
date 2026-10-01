import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, userId } = await req.json();
    if (!token || !userId) {
      return new Response(JSON.stringify({ error: 'Token and userId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Hash token to compare with stored token_hash
    const encoder = new TextEncoder();
    const data = encoder.encode(token.trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Fetch valid unused invite within 72 hours
    const { data: invite, error: fetchError } = await supabaseAdmin
      .from('admin_invites')
      .select('*')
      .eq('token_hash', tokenHash)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (fetchError || !invite) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired administrative invitation token.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark invite as used
    await supabaseAdmin
      .from('admin_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invite.id);

    // Promote user to admin role
    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update({
        role: 'admin',
        is_verified: true,
        verification_status: 'Verified',
      })
      .eq('id', userId);

    if (userUpdateError) {
      throw userUpdateError;
    }

    // Upsert into admin_profiles
    await supabaseAdmin
      .from('admin_profiles')
      .upsert({
        user_id: userId,
        admin_role: invite.role || 'moderator',
        assigned_department: 'Institutional Cell',
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Administrative privileges granted successfully.',
        role: invite.role || 'moderator',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
