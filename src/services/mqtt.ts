/**
 * MQTT Service
 * Handles real-time connection to the IoT broker for live vital signs streaming.
 * In development, this simulates incoming MQTT messages.
 * In production, connect to your broker (e.g. HiveMQ, Mosquitto, AWS IoT Core).
 */

import type { VitalSigns } from '@/types';

export type MqttMessageHandler = (patientId: string, vitals: VitalSigns) => void;

interface MqttConfig {
  brokerUrl: string;
  port: number;
  username?: string;
  password?: string;
  useTLS: boolean;
}

const DEFAULT_CONFIG: MqttConfig = {
  brokerUrl: 'broker.hivemq.com',
  port: 8884,
  useTLS: true,
};

class MqttService {
  private config: MqttConfig = DEFAULT_CONFIG;
  private connected = false;
  private simulationIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private handlers: MqttMessageHandler[] = [];

  configure(config: Partial<MqttConfig>) {
    this.config = { ...this.config, ...config };
  }

  connect(): Promise<void> {
    return new Promise((resolve) => {
      // TODO: Replace simulation with real MQTT.js client
      // import mqtt from 'mqtt';
      // this.client = mqtt.connect(`wss://${this.config.brokerUrl}:${this.config.port}/mqtt`, {
      //   username: this.config.username,
      //   password: this.config.password,
      // });
      console.log(`[MQTT] Connecting to ${this.config.brokerUrl}:${this.config.port}...`);
      setTimeout(() => {
        this.connected = true;
        console.log('[MQTT] Connected (simulation mode)');
        resolve();
      }, 500);
    });
  }

  subscribe(topic: string, handler: MqttMessageHandler) {
    this.handlers.push(handler);
    console.log(`[MQTT] Subscribed to topic: ${topic}`);
  }

  /**
   * Starts simulated real-time data for development.
   * Call this with your patient IDs to get live-updating mock vitals.
   */
  startSimulation(patientIds: string[], baseVitals: Record<string, VitalSigns>) {
    patientIds.forEach((id) => {
      if (this.simulationIntervals.has(id)) return;

      const interval = setInterval(() => {
        const base = baseVitals[id];
        if (!base) return;

        const simulated: VitalSigns = {
          heartRate: Math.round(base.heartRate + (Math.random() - 0.5) * 8),
          temperature: parseFloat((base.temperature + (Math.random() - 0.5) * 0.3).toFixed(1)),
          systolicBP: Math.round(base.systolicBP + (Math.random() - 0.5) * 10),
          diastolicBP: Math.round(base.diastolicBP + (Math.random() - 0.5) * 6),
          timestamp: new Date().toISOString(),
        };

        this.handlers.forEach((h) => h(id, simulated));
      }, 5000); // Update every 5 seconds

      this.simulationIntervals.set(id, interval);
    });
  }

  stopSimulation() {
    this.simulationIntervals.forEach((interval) => clearInterval(interval));
    this.simulationIntervals.clear();
  }

  disconnect() {
    this.stopSimulation();
    this.connected = false;
    this.handlers = [];
    console.log('[MQTT] Disconnected');
  }

  isConnected() {
    return this.connected;
  }
}

export const mqttService = new MqttService();
