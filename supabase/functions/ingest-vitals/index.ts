import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const WEBHOOK_SECRET = Deno.env.get('INGEST_WEBHOOK_SECRET')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET)
    return new Response('Unauthorized', { status: 401 });

  if (req.method !== 'POST')
    return new Response('Method Not Allowed', { status: 405 });

  let body: {
    channel_id:  string;
    heart_rate:  number | null;
    spo2:        number | null;
    temperature: number | null;
    latitude:    number | null;
    longitude:   number | null;
  };

  try        { body = await req.json(); }
  catch (_e) { return new Response('Invalid JSON', { status: 400 }); }

  const { channel_id, heart_rate, spo2, temperature, latitude, longitude } = body;
  if (!channel_id) return new Response('Missing channel_id', { status: 422 });

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('thingspeak_channel_id', channel_id)
    .single();

  if (!patient) return new Response('Unknown channel — skipped', { status: 200 });

  const { error } = await supabase.from('vitals_log').insert({
    patient_id:  patient.id,
    heart_rate:  heart_rate  ?? null,
    spo2:        spo2        ?? null,
    temperature: temperature ?? null,
    latitude:    latitude    ?? null,
    longitude:   longitude   ?? null,
  });

  if (error) return new Response('Insert failed', { status: 500 });
  return new Response('OK', { status: 200 });
});