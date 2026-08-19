import React, { useState } from 'react';
import type { LeakAlert } from '../types';
import { postAlertNotify } from '../services/api';
import { AlertTriangle, Send, CheckCircle, XCircle, Loader2, BellOff } from 'lucide-react';

interface NotificationPanelProps {
  alerts: LeakAlert[];
  onClose?: () => void;
}

const timeAgo = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ alerts }) => {
  const [notifyingIds, setNotifyingIds] = useState<Record<number, 'loading' | 'success' | 'error'>>({});

  const activeAlerts = alerts.filter(a => a.status === 'active').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleNotify = async (alertId: number) => {
    setNotifyingIds(prev => ({ ...prev, [alertId]: 'loading' }));
    try {
      await postAlertNotify(alertId, 'sms');
      setNotifyingIds(prev => ({ ...prev, [alertId]: 'success' }));
    } catch {
      setNotifyingIds(prev => ({ ...prev, [alertId]: 'error' }));
    }
  };

  return (
    <div className="absolute right-0 top-full z-[1000] mt-2 w-80 rounded-lg border border-slate-700/80 bg-[#0f1829]/95 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-700/80 p-4">
        <h3 className="text-sm font-semibold text-white">Active Alerts</h3>
        <span className="rounded bg-status-alert/20 px-2 py-0.5 text-xs font-semibold text-status-alert">
          {activeAlerts.length}
        </span>
      </div>
      <div className="max-h-96 overflow-y-auto p-2 custom-scrollbar">
        {activeAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-slate-500">
            <BellOff className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No active alerts</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeAlerts.map(alert => (
              <div key={alert.alert_id} className="rounded-md border border-slate-700/50 bg-slate-800/40 p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-status-alert" />
                    <span className="text-sm font-medium text-white capitalize">{alert.zone_id.replace('_', ' ')}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{timeAgo(alert.timestamp)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  Estimated Loss: <span className="font-semibold">{(alert.estimated_loss_litres / 1000).toFixed(0)}k L</span>
                </p>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => handleNotify(alert.alert_id)}
                    disabled={notifyingIds[alert.alert_id] === 'loading' || notifyingIds[alert.alert_id] === 'success'}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      notifyingIds[alert.alert_id] === 'success'
                        ? 'bg-status-safe/20 text-status-safe'
                        : notifyingIds[alert.alert_id] === 'error'
                        ? 'bg-status-critical/20 text-status-critical hover:bg-status-critical/30'
                        : 'bg-accent/10 text-accent hover:bg-accent/20'
                    }`}
                  >
                    {notifyingIds[alert.alert_id] === 'loading' ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...</>
                    ) : notifyingIds[alert.alert_id] === 'success' ? (
                      <><CheckCircle className="h-3.5 w-3.5" /> Sent</>
                    ) : notifyingIds[alert.alert_id] === 'error' ? (
                      <><XCircle className="h-3.5 w-3.5" /> Retry</>
                    ) : (
                      <><Send className="h-3.5 w-3.5" /> Notify via SMS</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
