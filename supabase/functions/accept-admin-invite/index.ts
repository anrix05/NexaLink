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
    const authHeader = req.headers.get('Authorization') ?? req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required. Missing or invalid Bearer token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify caller session and identity cryptographically via GoTrue
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    if (authError || !authData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired caller session.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const caller = authData.user;
    const callerId = caller.id;
    const callerEmail = caller.email?.toLowerCase().trim();

    if (!callerEmail) {
      return new Response(
        JSON.stringify({ error: 'Caller account has no verified email address.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invitation token is required in request body.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        JSON.stringify({ error: 'Invalid, already used, or expired administrative invitation token.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Strictly enforce that caller email matches the invited email address
    const invitedEmail = (invite.email || invite.invited_email || '').toLowerCase().trim();
    if (invitedEmail && callerEmail !== invitedEmail) {
      return new Response(
        JSON.stringify({
          error: 'Access denied: This invitation was issued to a different email address. Caller identity does not match recipient.',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark invite as used
    await supabaseAdmin
      .from('admin_invites')
      .update({
        used_at: new Date().toISOString(),
        status: 'accepted',
      })
      .eq('id', invite.id);

    // Promote the authenticated caller (and ONLY the caller) to admin role
    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update({
        role: 'admin',
        is_verified: true,
        verification_status: 'Verified',
      })
      .eq('id', callerId);

    if (userUpdateError) {
      throw userUpdateError;
    }

    // Upsert into admin_profiles for callerId
    await supabaseAdmin
      .from('admin_profiles')
      .upsert({
        user_id: callerId,
        admin_role: invite.role || 'moderator',
        assigned_department: invite.department || 'Institutional Cell',
      });

    // Write audit trail entry
    try {
      await supabaseAdmin.rpc('write_audit_log', {
        p_action: 'ADMIN_INVITE_ACCEPTED',
        p_details: `Admin invite accepted by verified user ${callerEmail}`,
        p_target_id: callerId,
        p_is_bulk: false,
        p_metadata: { inviteId: invite.id, role: invite.role || 'moderator' },
      });
    } catch (_e) {
      // Non-fatal if RPC helper not exposed to client
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Administrative privileges granted successfully to authenticated account.',
        role: invite.role || 'moderator',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error while accepting invite.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
