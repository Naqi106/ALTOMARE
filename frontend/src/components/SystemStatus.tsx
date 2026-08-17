import React from 'react';
import { Activity } from 'lucide-react';

export const SystemStatus: React.FC = () => {
  return (
    <div className="flex h-full items-center justify-between rounded-lg border border-emerald-400/15 bg-[#172235]/80 p-5">
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative rounded-md border border-status-safe/30 bg-status-safe/10 p-3">
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-status-safe shadow-[0_0_14px_rgba(16,185,129,0.8)]" />
          <Activity className="h-5 w-5 text-status-safe" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">System Online</h4>
          <p className="mt-1 text-xs text-slate-500">All sensors and data streams operational</p>
        </div>
      </div>
      <div className="text-right">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Last Sync</p>
        <p className="text-sm font-black text-slate-100">{new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};
