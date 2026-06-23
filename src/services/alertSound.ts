// Generates a clinical-style alert tone using the Web Audio API.
// No external audio files needed — works offline, no CORS issues.

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

/** Single short beep. frequency in Hz, duration in seconds. */
function beep(ctx: AudioContext, frequency: number, duration: number, gain = 0.35) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.connect(env);
  env.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  // Quick attack, smooth release — avoids a harsh click
  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01);
  env.gain.setValueAtTime(gain, ctx.currentTime + duration - 0.05);
  env.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/**
 * Critical alert — three rising beeps (mimics hospital alarm pattern).
 * Safe to call from a user-gesture handler OR proactively after first
 * interaction (AudioContext resumes automatically on modern browsers).
 */
export async function playCriticalAlert() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    beep(ctx, 880, 0.18);          // A5
    setTimeout(() => beep(ctx, 1046, 0.18), 220); // C6
    setTimeout(() => beep(ctx, 1318, 0.28), 440); // E6
  } catch (err) {
    // AudioContext blocked (no user gesture yet) — silently ignore
    console.warn('[alertSound] Could not play sound:', err);
  }
}

/**
 * Warning alert — two soft beeps at the same pitch.
 */
export async function playWarningAlert() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    beep(ctx, 660, 0.15, 0.2);
    setTimeout(() => beep(ctx, 660, 0.15, 0.2), 200);
  } catch (err) {
    console.warn('[alertSound] Could not play sound:', err);
  }
}

/**
 * Info alert — one gentle soft beep.
 */
export async function playInfoAlert() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    beep(ctx, 520, 0.12, 0.12);
  } catch (err) {
    console.warn('[alertSound] Could not play sound:', err);
  }
}

// ─── Priority sound queue ─────────────────────────────────────────────────
// Plays pending alert sounds in sequence (critical → warning → info)
// so they never overlap into noise, and none are dropped.

type SoundPriority = { severity: 'critical' | 'warning' | 'info'; fn: () => Promise<void> };

let queue: SoundPriority[] = [];
let isPlaying = false;

async function drainQueue() {
  if (isPlaying || queue.length === 0) return;
  isPlaying = true;

  queue.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  while (queue.length > 0) {
    const next = queue.shift()!;
    await next.fn();
    await new Promise((r) => setTimeout(r, 400));
  }

  isPlaying = false;
}

export function queueAlert(severity: 'critical' | 'warning' | 'info') {
  const fn =
    severity === 'critical' ? playCriticalAlert
    : severity === 'warning' ? playWarningAlert
    : playInfoAlert;

    vibrateAlert(severity); // haptic fires immediately, no need to queue
    queue.push({ severity, fn });
    drainQueue();

}


// ─── Haptic vibration (mobile web only) ──────────────────────────────────
// navigator.vibrate is supported on Android Chrome/Firefox.
// iOS Safari does not support it — the call is safely ignored.

export function vibrateAlert(severity: 'critical' | 'warning' | 'info') {
  if (!navigator.vibrate) return;

  switch (severity) {
    case 'critical':
      // Long-short-long — urgent, hard to ignore
      navigator.vibrate([300, 100, 300, 100, 300]);
      break;
    case 'warning':
      // Two medium pulses
      navigator.vibrate([200, 100, 200]);
      break;
    case 'info':
      // Single short tap
      navigator.vibrate(100);
      break;
  }
}