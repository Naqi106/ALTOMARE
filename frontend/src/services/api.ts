import axios from 'axios';
import type { Zone, LeakAlert, CorrelationEvent } from '../types';
import { mockZones, mockAlerts, mockCorrelationEvents, mockRevenueSummary } from '../data/mockData';

// Stub Axios instance for Day 1
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// Day 1: Return mock data instead of making actual backend calls
export const getZones = async (): Promise<Zone[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(mockZones), 500));
};

export const getAlerts = async (): Promise<LeakAlert[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(mockAlerts), 500));
};

export const getCorrelation = async (zone_id: number): Promise<CorrelationEvent[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockCorrelationEvents.filter(e => e.zone_id === zone_id));
    }, 500);
  });
};

export const getRevenueSummary = async () => {
  return new Promise((resolve) => setTimeout(() => resolve(mockRevenueSummary), 500));
};

// Functions to be wired up later
export const postReading = async (data: any) => {
  return api.post('/readings', data);
};

export const postQuality = async (data: any) => {
  return api.post('/quality', data);
};

export const postAlertNotify = async (alert_id: number) => {
  return api.post('/alerts/notify', { alert_id });
};
