// src/hooks/useSettings.ts
// Pulls real profile data from AuthContext and persists settings to localStorage.

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import type { AppSettings } from '@/types';

const STORAGE_KEY = 'vitalsync-settings';

const DEFAULT_SETTINGS: AppSettings = {
  alertsEnabled:    true,
  alertSound:       true,
  autoRefresh:      true,
  refreshInterval:  5,
  temperatureUnit:  'C',
  theme:            'dark',
  mqttBroker:       'broker.hivemq.com',
  thingspeakApiKey: '',
  googleMapsApiKey: '',
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable — fail silently
  }
}

export function useSettings() {
  const { profile } = useAuthContext();
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  // Persist to localStorage whenever settings change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Derive display values from real auth profile
  const fullName  = profile?.full_name?.trim() || profile?.email || 'Unknown User';
  const email     = profile?.email ?? '';
  const role      = profile?.role  ?? 'doctor';

  // Generate initials from full name
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const displayProfile = {
    name:           fullName,
    email,
    role,
    avatarInitials: initials || '?',
  };

  return { settings, displayProfile, updateSetting };
}