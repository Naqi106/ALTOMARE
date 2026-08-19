import React, { useState } from 'react';
import { Bell, RadioTower, User } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import type { LeakAlert } from '../types';

interface NavbarProps {
  alerts?: LeakAlert[];
  alertsError?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ alerts = [] }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 bg-[#121c2e]/95 px-7">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
          <RadioTower className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-base font-black uppercase tracking-[0.08em] text-slate-100">
            Water Intelligence Command Center
          </h2>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Municipal NRW Operations</p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg border border-slate-700/70 bg-white/[0.03] p-2.5 text-slate-400 transition hover:border-accent/50 hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {activeAlertsCount > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-status-alert shadow-[0_0_12px_rgba(249,115,22,0.9)]" />
            )}
          </button>
          
          {showNotifications && (
            <NotificationPanel alerts={alerts} onClose={() => setShowNotifications(false)} />
          )}
        </div>

        <div className="flex items-center gap-3 border-l border-slate-700/80 pl-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80">
            <User className="h-4 w-4 text-slate-300" />
          </div>
          <div className="hidden min-w-0 flex-col sm:flex">
            <span className="text-sm font-bold text-slate-100">Admin Operator</span>
            <span className="text-xs text-slate-500">System Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};
