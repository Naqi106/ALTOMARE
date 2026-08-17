import React from 'react';
import type { LeakAlert } from '../types';
import { StatusBadge } from './StatusBadge';
import { AlertCircle, Clock, Droplets } from 'lucide-react';

interface AlertCardProps {
  alert: LeakAlert;
  zoneName: string;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, zoneName }) => {
  const confidencePercent = Math.round(alert.confidence_score * 100);
  const alertTime = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(new Date(alert.timestamp));
  const isHighLoss = alert.estimated_loss_litres >= 100000;

  return (
    <div className={`group rounded-lg border bg-[#172235]/80 p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-[#1b2940] ${
      isHighLoss ? 'border-status-critical/50 shadow-[0_0_0_1px_rgba(239,68,68,0.08)]' : 'border-slate-700/70 hover:border-status-alert/50'
    }`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
            isHighLoss ? 'border-status-critical/40 bg-status-critical/10 text-status-critical' : 'border-status-alert/30 bg-status-alert/10 text-status-alert'
          }`}>
            <AlertCircle className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold text-slate-100">{zoneName}</h4>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
              <Clock className="h-3 w-3" />
              {alertTime}
            </div>
          </div>
        </div>
        <StatusBadge status={alert.status === 'active' ? 'ALERT' : 'SAFE'} />
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Estimated Loss</p>
          <div className={`flex items-center text-base font-black ${isHighLoss ? 'text-status-critical' : 'text-status-alert'}`}>
            <Droplets className="mr-1.5 h-3.5 w-3.5" />
            {(alert.estimated_loss_litres / 1000).toFixed(1)}k L
          </div>
        </div>
        <div className="text-right">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Confidence</p>
          <div className="flex items-center justify-end gap-2">
            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
              <span className="block h-full rounded-full bg-accent" style={{ width: `${confidencePercent}%` }} />
            </span>
            <p className="text-sm font-bold text-white">{confidencePercent}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};
