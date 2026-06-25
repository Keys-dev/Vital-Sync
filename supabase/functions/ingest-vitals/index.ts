// supabase/functions/ingest-vitals/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Relay between Arduino hardware and Supabase.
//
// Arduino sends POST to this Edge Function URL with:
// {
//   "device_code": "VS-001",
//   "heart_rate": 82,
//   "temperature": 37.1,
//   "systolic_bp": 118,
//   "diastolic_bp": 76,
//   "latitude": 6.5244,
//   "longitude": 3.3792,
//   "battery_level": 91
// }
//
// The function:
//  1. Validates the secret token so random internet requests are rejected
//  2. Looks up device_code → patient_id in the devices table
//  3. Inserts into vitals_log with the correct patient_id
//  4. Updates device.last_seen + status + battery_level
//  5. Auto-registers unknown devices as 'unassigned' (self-registration)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// Set INGEST_SECRET in Supabase → Edge Functions → Secrets
// Burn the same value into your Arduino firmware
const INGEST_SECRET     = Deno.env.get('INGEST_WEBHOOK_SECRET') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-secret-token, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ── Auth: check shared secret header ───────────────────────────────────
  const token = req.headers.get('x-secret-token') ?? '';
  if (INGEST_SECRET && token !== INGEST_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Parse payload ───────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const device_code = (body.device_code as string | undefined)?.trim();
  if (!device_code) {
    return new Response(JSON.stringify({ error: 'device_code is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

  // ── 1. Look up device ───────────────────────────────────────────────────
  let { data: device, error: deviceErr } = await supabase
    .from('devices')
    .select('id, patient_id, status')
    .eq('device_code', device_code)
    .maybeSingle();

  if (deviceErr) {
    console.error('[ingest] device lookup error:', deviceErr);
    return new Response(JSON.stringify({ error: 'Device lookup failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── 2. Auto-register if unknown ─────────────────────────────────────────
  if (!device) {
    const { data: newDevice, error: insertErr } = await supabase
      .from('devices')
      .insert({
        device_code,
        label:  `Auto-registered: ${device_code}`,
        status: 'unassigned',
      })
      .select('id, patient_id, status')
      .single();

    if (insertErr) {
      console.error('[ingest] auto-register error:', insertErr);
      return new Response(JSON.stringify({ error: 'Device registration failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    device = newDevice;
    console.log(`[ingest] Auto-registered new device: ${device_code}`);
  }

  // ── 3. Update device heartbeat ──────────────────────────────────────────
  await supabase
    .from('devices')
    .update({
      last_seen:     new Date().toISOString(),
      status:        device.patient_id ? 'online' : 'unassigned',
      battery_level: body.battery_level ?? null,
    })
    .eq('device_code', device_code);

  // ── 4. If unassigned, stop here — no patient to write vitals for ────────
  if (!device.patient_id) {
    return new Response(
      JSON.stringify({ ok: true, status: 'unassigned', message: 'Device not yet assigned to a patient' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // ── 5. Insert vitals_log row ────────────────────────────────────────────
  const { error: vitalsErr } = await supabase
    .from('vitals_log')
    .insert({
      patient_id:   device.patient_id,
      device_code,
      heart_rate:   body.heart_rate   ?? null,
      temperature:  body.temperature  ?? null,
      systolic_bp:  body.systolic_bp  ?? null,
      diastolic_bp: body.diastolic_bp ?? null,
      latitude:     body.latitude     ?? null,
      longitude:    body.longitude    ?? null,
      recorded_at:  new Date().toISOString(),
    });

  if (vitalsErr) {
    console.error('[ingest] vitals insert error:', vitalsErr);
    return new Response(JSON.stringify({ error: 'Vitals insert failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ ok: true, patient_id: device.patient_id }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});