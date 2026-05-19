import { useState } from 'react';
import type { AppSettings, UserProfile } from '@/types';

const DEFAULT_SETTINGS: AppSettings = {
  alertSound: true,
  autoRefresh: true,
  refreshInterval: 5,
  temperatureUnit: 'C',
  theme: 'dark',
  mqttBroker: 'broker.hivemq.com',
  thingspeakApiKey: '',
  googleMapsApiKey: '',
};

const DEFAULT_PROFILE: UserProfile = {
  id: 'U001',
  name: 'Dr. Fatima Bello',
  role: 'admin',
  email: 'f.bello@vitalsync.ng',
  department: 'Cardiology',
  avatarInitials: 'FB',
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [profile] = useState<UserProfile>(DEFAULT_PROFILE);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return { settings, profile, updateSetting };
}
