/**
 * Vitals Utility Service
 * Helper functions for thresholds, status computation, and formatting.
 */

import type { VitalSigns, VitalThresholds, PatientStatus } from '@/types';

export const DEFAULT_THRESHOLDS: VitalThresholds = {
  heartRate: { min: 60, max: 100 },
  temperature: { min: 36.1, max: 37.9 },
  systolicBP: { min: 90, max: 140 },
  diastolicBP: { min: 60, max: 90 },
};

export function computePatientStatus(vitals: VitalSigns): PatientStatus {
  const t = DEFAULT_THRESHOLDS;
  const isCritical =
    vitals.heartRate > 120 ||
    vitals.heartRate < 50 ||
    vitals.temperature > 39.5 ||
    vitals.temperature < 35 ||
    vitals.systolicBP > 180 ||
    vitals.systolicBP < 80;

  const isWarning =
    vitals.heartRate > t.heartRate.max ||
    vitals.heartRate < t.heartRate.min ||
    vitals.temperature > t.temperature.max ||
    vitals.temperature < t.temperature.min ||
    vitals.systolicBP > t.systolicBP.max ||
    vitals.diastolicBP > t.diastolicBP.max;

  if (isCritical) return 'critical';
  if (isWarning) return 'warning';
  return 'stable';
}

export function isVitalAbnormal(
  key: keyof Omit<VitalSigns, 'timestamp'>,
  value: number
): 'critical' | 'warning' | 'normal' {
  const t = DEFAULT_THRESHOLDS;
  switch (key) {
    case 'heartRate':
      if (value > 120 || value < 50) return 'critical';
      if (value > t.heartRate.max || value < t.heartRate.min) return 'warning';
      break;
    case 'temperature':
      if (value > 39.5 || value < 35) return 'critical';
      if (value > t.temperature.max || value < t.temperature.min) return 'warning';
      break;
    case 'systolicBP':
      if (value > 180 || value < 80) return 'critical';
      if (value > t.systolicBP.max || value < t.systolicBP.min) return 'warning';
      break;
    case 'diastolicBP':
      if (value > 110 || value < 50) return 'critical';
      if (value > t.diastolicBP.max || value < t.diastolicBP.min) return 'warning';
      break;
  }
  return 'normal';
}

export function formatVital(key: keyof Omit<VitalSigns, 'timestamp'>, value: number): string {
  switch (key) {
    case 'heartRate': return `${value} bpm`;
    case 'temperature': return `${value.toFixed(1)} \u00b0C`;
    case 'systolicBP':
    case 'diastolicBP': return `${value} mmHg`;
    default: return `${value}`;
  }
}

export function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function statusColor(status: PatientStatus): string {
  switch (status) {
    case 'critical': return 'text-status-critical';
    case 'warning': return 'text-status-warning';
    case 'stable': return 'text-status-stable';
    default: return 'text-status-inactive';
  }
}

export function statusBg(status: PatientStatus): string {
  switch (status) {
    case 'critical': return 'bg-red-500/10 border-red-500/30 text-status-critical';
    case 'warning': return 'bg-yellow-500/10 border-yellow-500/30 text-status-warning';
    case 'stable': return 'bg-teal-500/10 border-teal-500/30 text-status-stable';
    default: return 'bg-slate-500/10 border-slate-500/30 text-status-inactive';
  }
}

// ─── GPS helpers (for the live tracking breadcrumb / telemetry sidebar) ────

/** Great-circle distance between two lat/lng points, in kilometres. */
export function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371; // Earth radius, km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Speed in km/h between two timestamped GPS points.
 * Returns null if the points are identical, out of order, or too close
 * in time to give a meaningful reading (avoids divide-by-near-zero spikes).
 */
export function computeSpeedKmh(
  prev: { lat: number; lng: number; timestamp: string },
  curr: { lat: number; lng: number; timestamp: string }
): number | null {
  const dtHours =
    (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 3_600_000;

  if (dtHours <= 0 || dtHours > 1) return null; // ignore bad/huge gaps

  const distanceKm = haversineDistanceKm(prev, curr);
  return distanceKm / dtHours;
}