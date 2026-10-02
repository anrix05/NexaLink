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
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract client IP address reliably from reverse proxy headers
    const clientIp = (
      req.headers.get('cf-connecting-ip') ??
      req.headers.get('x-real-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      '127.0.0.1'
    ).trim();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Hash email to preserve user privacy in storage
    const encoder = new TextEncoder();
    const data = encoder.encode(email.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const emailHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    // 1. IP + Email Bound Lockout: Only lock out attempts from the offending IP address
    // This prevents malicious actors from causing denial-of-service on victim accounts.
    const { data: ipEmailAttempts, error: ipEmailError } = await supabaseAdmin
      .from('auth_attempts')
      .select('id')
      .eq('email_hash', emailHash)
      .eq('ip_address', clientIp)
      .eq('success', false)
      .gte('attempted_at', fifteenMinutesAgo);

    if (ipEmailError) {
      console.error('Error querying auth_attempts by IP + Email:', ipEmailError);
    }

    const failedForIpAndEmail = ipEmailAttempts?.length || 0;

    // 2. Global IP Brute-Force Guard (protects against credential stuffing across emails)
    const { data: globalIpAttempts, error: globalIpError } = await supabaseAdmin
      .from('auth_attempts')
      .select('id')
      .eq('ip_address', clientIp)
      .eq('success', false)
      .gte('attempted_at', fifteenMinutesAgo);

    if (globalIpError) {
      console.error('Error querying auth_attempts by IP globally:', globalIpError);
    }

    const failedForIpGlobally = globalIpAttempts?.length || 0;

    // Enforce lockout if this IP has 5 failed attempts for this email, or 20 total failed attempts
    if (failedForIpAndEmail >= 5 || failedForIpGlobally >= 20) {
      return new Response(
        JSON.stringify({
          locked: true,
          error: 'Too many failed login attempts from your network. Temporary 15-minute cool-down enforced.',
          retryAfterSeconds: 900,
          ipBound: true,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        locked: false,
        remainingAttempts: Math.max(0, 5 - failedForIpAndEmail),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
