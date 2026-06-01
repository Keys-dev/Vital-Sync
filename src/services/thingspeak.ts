import type { VitalHistory } from '@/types';

interface ThingSpeakFeed {
  created_at: string;
  field1?: string;
  field2?: string;
  field3?: string;
  field4?: string;
}

interface ThingSpeakResponse {
  channel: { name: string };
  feeds: ThingSpeakFeed[];
}

class ThingSpeakService {
  private apiKey = import.meta.env.VITE_THINGSPEAK_API_KEY ?? '';
  private baseUrl = 'https://api.thingspeak.com';

  configure(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchHistory(channelId: string, results = 24): Promise<VitalHistory[]> {
    if (!this.apiKey) {
      console.warn('[ThingSpeak] No API key configured — returning empty history');
      return [];
    }

    try {
      const url = `${this.baseUrl}/channels/${channelId}/feeds.json?api_key=${this.apiKey}&results=${results}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ThingSpeakResponse = await res.json();

      return data.feeds.map((feed) => ({
        time: new Date(feed.created_at).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        heartRate: parseFloat(feed.field1 ?? '0'),
        temperature: parseFloat(feed.field2 ?? '0'),
        systolicBP: parseFloat(feed.field3 ?? '0'),
        diastolicBP: parseFloat(feed.field4 ?? '0'),
      }));
    } catch (err) {
      console.error('[ThingSpeak] Fetch error:', err);
      return [];
    }
  }
}

export const thingSpeakService = new ThingSpeakService();
