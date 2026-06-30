// ─── Database / Auth types ────────────────────────────────────────────────────

export type UserRole = 'doctor' | 'family';

export interface Profile {
  id:         string;
  email:      string;
  role:       UserRole;
  full_name:  string;
  created_at: string;
}

export interface DBPatient {
  id:                    string;
  full_name:             string;
  date_of_birth:         string;
}

export interface VitalsRow {
  id:           string;
  patient_id:   string;
  heart_rate:   number | null;
  temperature:  number | null;
  systolic_bp:  number | null;
  diastolic_bp: number | null;
  latitude:     number | null;
  longitude:    number | null;
  recorded_at:  string;
}

export interface AccessRequest {
  id:              string;
  status:          'pending' | 'approved' | 'rejected';
  created_at:      string;
  patient_id:      string;
  patient_name:    string;
  requester_id:    string;
  requester_name:  string;
  requester_email: string;
}


// ─── Patient & Vitals ──────────────────────────────────────────────────────

export type PatientStatus = 'critical' | 'warning' | 'stable' | 'inactive';
export type PatientGender = 'Male' | 'Female' | 'Other';

export interface VitalSigns {
  heartRate: number;         // bpm
  temperature: number;       // °C
  systolicBP: number;        // mmHg
  diastolicBP: number;       // mmHg
  timestamp: string;         // ISO string
}

export interface VitalThresholds {
  heartRate: { min: number; max: number };
  temperature: { min: number; max: number };
  systolicBP: { min: number; max: number };
  diastolicBP: { min: number; max: number };
}

export interface VitalHistory {
  time: string;
  heartRate: number;
  temperature: number;
  systolicBP: number;
  diastolicBP: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: PatientGender;
  bedNumber: string;
  admissionDate: string;
  diagnosis: string;
  doctorAssigned: string;
  status: PatientStatus;
  vitals: VitalSigns;
  vitalHistory: VitalHistory[];
  location: { lat: number; lng: number };
  deviceId: string;
  bloodType: string;
  emergencyContact: string;
}

// ─── Alerts ────────────────────────────────────────────────────────────────

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType =
  | 'heart_rate'
  | 'temperature'
  | 'blood_pressure'
  | 'device'
  | 'system';

export interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  value: string;
  threshold: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

// ─── Timeline ──────────────────────────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  patientId: string;
  type: 'admission' | 'discharge' | 'alert' | 'medication' | 'checkup' | 'procedure';
  description: string;
  timestamp: string;
  performedBy?: string;
}

// ─── Device / IoT ──────────────────────────────────────────────────────────

export type DeviceStatus = 'online' | 'offline' | 'unassigned';

export interface Device {
  id:               string;
  device_code:      string;
  label:            string;
  patient_id:       string | null;
  status:           DeviceStatus;
  last_seen:        string | null;
  battery_level:    number | null;
  firmware_version: string | null;
  created_at:       string;
  // joined from patients table (UI convenience)
  patient_name?:    string;
}

// ─── Settings ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  role: 'admin' | 'doctor' | 'nurse';
  email: string;
  department: string;
  avatarInitials: string;
}

export interface AppSettings {
  alertsEnabled:    boolean;  // ← NEW: master on/off for all alerts
  alertSound:       boolean;
  autoRefresh:      boolean;
  refreshInterval:  number;   // seconds
  temperatureUnit:  'C' | 'F';
  theme:            'dark' | 'light';
  googleMapsApiKey: string;   // optional Google Maps API key for GPS Tracker
}

// ─── Dashboard Stats ───────────────────────────────────────────────────────

export interface DashboardStats {
  totalPatients: number;
  criticalPatients: number;
  warningPatients: number;
  stablePatients: number;
  activeAlerts: number;
  devicesOnline: number;
}