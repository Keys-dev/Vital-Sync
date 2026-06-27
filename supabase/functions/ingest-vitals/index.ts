// supabase/functions/ingest-vitals/index.ts
//
// Accepts GET requests from Arduino hardware with URL query parameters:
// ?pid=...&systolic=120&diastolic=78&pulse=85&temperature=37.1&latitude=6.5244&longitude=3.3792
//
// ─── PID MODE ────────────────────────────────────────────────────────────────
//
// MODE A (currently active): pid = PATIENT ID (UUID from your patients table)
//   → skips device lookup entirely, inserts directly into vitals_log
//   → simpler, works if the hardware partner hardcodes the patient UUID
//
// MODE B (commented out): pid = DEVICE CODE (e.g. "VS-001")
//   → looks up device in the devices table → gets patient_id from there
//   → supports device reassignment, auto-registration, battery tracking
//   → uncomment MODE B blocks and comment MODE A blocks to switch
//
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const INGEST_SECRET    = Deno.env.get('INGEST_WEBHOOK_SECRET') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-secret-token, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ── Parse URL query parameters ────────────────────────────────────────────
  const url    = new URL(req.url);
  const params = url.searchParams;

  const pid         = params.get('pid')?.trim();        // see mode notes above
  const systolic    = params.get('systolic');
  const diastolic   = params.get('diastolic');
  const pulse       = params.get('pulse');              // heart rate
  const temperature = params.get('temperature');
  const latitude    = params.get('latitude');
  const longitude   = params.get('longitude');

  // Optional secret — Arduino can pass as ?secret=... or x-secret-token header
  const secret = params.get('secret') ?? req.headers.get('x-secret-token') ?? '';
  if (INGEST_SECRET && secret !== INGEST_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!pid) {
    return new Response(JSON.stringify({ error: 'pid is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

  // ════════════════════════════════════════════════════════════════════════════
  // MODE A — pid is a PATIENT ID (UUID)
  // ════════════════════════════════════════════════════════════════════════════

  // Verify the patient actually exists before inserting
  const { data: patient, error: patientErr } = await supabase
    .from('patients')
    .select('id')
    .eq('id', pid)
    .maybeSingle();

  if (patientErr) {
    return new Response(JSON.stringify({ error: 'Patient lookup failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!patient) {
    return new Response(JSON.stringify({ error: `No patient found with id: ${pid}` }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const patientId = pid;

  // ════════════════════════════════════════════════════════════════════════════
  // MODE B — pid is a DEVICE CODE (e.g. "VS-001")
  // Uncomment this entire block and comment out MODE A above to switch modes.
  // ════════════════════════════════════════════════════════════════════════════

  // // Look up device by device_code
  // let { data: device, error: deviceErr } = await supabase
  //   .from('devices')
  //   .select('id, patient_id, status')
  //   .eq('device_code', pid)
  //   .maybeSingle();
  //
  // if (deviceErr) {
  //   return new Response(JSON.stringify({ error: 'Device lookup failed' }), {
  //     status: 500,
  //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  //   });
  // }
  //
  // // Auto-register device if it's the first time we've seen this code
  // if (!device) {
  //   const { data: newDevice, error: insertErr } = await supabase
  //     .from('devices')
  //     .insert({ device_code: pid, label: `Auto-registered: ${pid}`, status: 'unassigned' })
  //     .select('id, patient_id, status')
  //     .single();
  //
  //   if (insertErr) {
  //     return new Response(JSON.stringify({ error: 'Device registration failed' }), {
  //       status: 500,
  //       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  //     });
  //   }
  //
  //   device = newDevice;
  //   console.log(`[ingest] Auto-registered new device: ${pid}`);
  // }
  //
  // // Update device last_seen + online status
  // await supabase
  //   .from('devices')
  //   .update({
  //     last_seen: new Date().toISOString(),
  //     status:    device.patient_id ? 'online' : 'unassigned',
  //   })
  //   .eq('device_code', pid);
  //
  // // If device isn't assigned to a patient yet, stop here
  // if (!device.patient_id) {
  //   return new Response(
  //     JSON.stringify({ ok: true, status: 'unassigned', message: 'Device not yet assigned to a patient' }),
  //     { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  //   );
  // }
  //
  // const patientId = device.patient_id;

  // ════════════════════════════════════════════════════════════════════════════
  // Insert vitals — same for both modes
  // ════════════════════════════════════════════════════════════════════════════

  const { error: vitalsErr } = await supabase
    .from('vitals_log')
    .insert({
      patient_id:   patientId,
      device_code:  pid,                                          // audit trail
      heart_rate:   pulse       ? parseFloat(pulse)       : null,
      temperature:  temperature ? parseFloat(temperature) : null,
      systolic_bp:  systolic    ? parseInt(systolic)      : null,
      diastolic_bp: diastolic   ? parseInt(diastolic)     : null,
      latitude:     latitude    ? parseFloat(latitude)    : null,
      longitude:    longitude   ? parseFloat(longitude)   : null,
      recorded_at:  new Date().toISOString(),
    });

  if (vitalsErr) {
    return new Response(
      JSON.stringify({ error: 'Vitals insert failed', detail: vitalsErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, patient_id: patientId }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});