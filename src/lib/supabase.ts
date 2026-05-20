import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseKey) {
  // Surface a visible error in the page instead of a silent blank screen
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
      font-family:monospace;background:#f0f4f8;padding:2rem;">
      <div style="background:#fff;border:1px solid #fca5a5;border-radius:12px;
        padding:2rem;max-width:520px;width:100%;">
        <p style="color:#d9293d;font-weight:700;font-size:1rem;margin-bottom:1rem;">
          ⚠ Missing environment variables
        </p>
        <p style="color:#0d1f2d;font-size:0.85rem;margin-bottom:1rem;">
          The app cannot start because Supabase credentials are not configured.
          Add these to your Vercel project under
          <strong>Settings → Environment Variables</strong>:
        </p>
        <pre style="background:#f0f4f8;border-radius:8px;padding:1rem;
          font-size:0.78rem;color:#6a8fa8;white-space:pre-wrap;">
VITE_SUPABASE_URL      ${supabaseUrl  ? '✅ set' : '❌ NOT SET'}
VITE_SUPABASE_ANON_KEY ${supabaseKey  ? '✅ set' : '❌ NOT SET'}
        </pre>
        <p style="color:#6a8fa8;font-size:0.75rem;margin-top:1rem;">
          After adding them, redeploy the project. The anon key starts with <code>eyJ…</code>
          and is found in Supabase → Project Settings → API.
        </p>
      </div>
    </div>
  `;
  throw new Error(
    `Missing Supabase env vars:\n` +
    `  VITE_SUPABASE_URL      = ${supabaseUrl  ?? 'undefined'}\n` +
    `  VITE_SUPABASE_ANON_KEY = ${supabaseKey  ?? 'undefined'}`
  );
}


export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storageKey: 'vitalsync-auth',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (url, options) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
      return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timeout));
    },
  },
});