import { useState, useEffect } from 'react';
import { getAlerts, getRevenueSummary } from './api';
import type { LeakAlert } from '../types';
import { demoNRWTrend, demoQualityTrend } from '../data/dashboardDemoData';

export const useNRWTrend = () => {
  const [data, setData] = useState<typeof demoNRWTrend | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate network delay for demo data
    const timer = setTimeout(() => {
      setData(demoNRWTrend);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return { data, loading };
};

export const useQualityTrend = () => {
  const [data, setData] = useState<typeof demoQualityTrend | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(demoQualityTrend);
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  return { data, loading };
};

export const useRevenueSummary = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    getRevenueSummary()
      .then((resData) => {
        if (mounted) {
          setData(resData);
          setLoading(false);
          setError(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Revenue polling failed:", err);
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
};

export const useLiveAlerts = (intervalMs = 15000) => {
  const [alerts, setAlerts] = useState<LeakAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    let timer: number;

    const fetchAlerts = async () => {
      try {
        const data = await getAlerts();
        if (mounted) {
          setAlerts(data);
          setError(false);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (mounted) {
          setError(true);
          console.error("LiveAlerts polling failed:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchAlerts();

    // Setup polling
    timer = window.setInterval(fetchAlerts, intervalMs);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [intervalMs]);

  return { alerts, loading, error, lastUpdated };
};
