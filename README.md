# VitalSync

A bridge between patients and the people caring for them. VitalSync streams real-time vitals from connected IoT sensors, flags anything that needs attention, and gives doctors and family members a shared, live view of what's going on — built to make remote patient monitoring feel less like a guessing game.

**Live demo:** [vital-sync-iota.vercel.app](https://vital-sync-iota.vercel.app)

## What It Does

VitalSync pulls sensor data (heart rate, temperature, blood pressure) from Arduino-based hardware through ThingSpeak, pipes it into a Postgres database, and pushes real-time alerts to whoever needs to see them — whether that's a doctor monitoring multiple patients or a family member checking in on one.

### Core features

- **Doctor portal** — monitor multiple patients, view live vitals, and filter by alert severity
- **Family member portal** — a simplified view scoped to a specific patient, with access controlled by request/approval
- **Real-time alerts** — a database-driven alert system using PostgreSQL triggers that fires the moment a vital reading crosses a defined threshold
- **GPS tracking** — location visibility for patients being monitored remotely
- **Health trends** — historical view of vitals over time, not just the current snapshot
- **Browser notifications** — alerts surface immediately in the browser, not just on a dashboard refresh

## Data Pipeline

```
Arduino (sensors) → ThingSpeak → Supabase (Postgres + Realtime) → Browser
```

Sensor readings are ingested via ThingSpeak, written into a `vitals_log` table in Supabase, and a PostgreSQL trigger on that table evaluates each new row against alert thresholds. Supabase Realtime then pushes any resulting alert straight to connected clients — no polling required.

## Tech Stack

- **Frontend:** React + TypeScript
- **Backend:** [Supabase](https://supabase.com/) — Postgres, Realtime subscriptions, Edge Functions
- **IoT Ingestion:** Arduino + [ThingSpeak](https://thingspeak.com/)
- **Auth:** Supabase Auth, with role-based portals (doctor vs. family member)
- **Deployment:** Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Add Supabase credentials to your .env file
# VITE_SUPABASE_URL=your-project-url
# VITE_SUPABASE_ANON_KEY=your-anon-key

# Run the development server
npm run dev
```

You'll also need a Supabase project with the `vitals_log` table and alert-trigger functions set up, plus a ThingSpeak channel configured to forward sensor data — see the `supabase/` directory for migrations and Edge Function source.

## Notable Implementation Details

- Real-time subscriptions are centralized in a single `AlertsContext` rather than being duplicated per-component, which resolved an earlier bug where duplicate Supabase Realtime subscriptions caused alerts to fire multiple times.
- Login/session handling required care around Supabase's domain allowlist and JWT reading patterns to work reliably once deployed on Vercel — straightforward locally, easy to misconfigure in production.

## Roadmap

- [ ] Expand sensor support beyond heart rate / temperature / blood pressure
- [ ] SMS/push notifications in addition to in-browser alerts
- [ ] Multi-patient analytics for clinics managing larger caseloads
