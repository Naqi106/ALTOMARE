import React from 'react';
import {
  Activity,
  BarChart3,
  BellRing,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Map,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const navItems = [
  { name: 'Dashboard', id: 'dashboard', icon: LayoutDashboard },
  { name: 'Alerts', id: 'alerts', icon: BellRing },
  { name: 'Zones', id: 'zones', icon: Map },
  { name: 'Analytics', id: 'analytics', icon: BarChart3 },
  { name: 'Reports', id: 'reports', icon: FileText },
  { name: 'Correlation', id: 'correlation', icon: Activity },
  { name: 'Revenue', id: 'revenue', icon: CircleDollarSign },
  { name: 'Settings', id: 'settings', icon: Settings },
];

const riskLevels = [
  ['SAFE', 'Green', 'bg-status-safe'],
  ['WARNING', 'Yellow', 'bg-status-warning'],
  ['ALERT', 'Orange', 'bg-status-alert'],
  ['CRITICAL', 'Red', 'bg-status-critical'],
];

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-800/80 bg-[#111a2b]">
      <div className="border-b border-slate-800/80 px-6 py-6">
        <h1 className="flex items-center text-xl font-black tracking-normal text-accent">
          <span className="mr-3 rounded-md bg-accent px-2 py-1 text-sm font-black text-background shadow-[0_0_22px_rgba(6,182,212,0.18)]">AM</span>
          AltoMare
        </h1>
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Ops Console</p>
      </div>

      <nav className="flex-1 px-4 py-5">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`group relative flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left text-sm font-semibold transition duration-200 ${
                  isActive
                    ? 'bg-accent/10 text-accent shadow-[inset_3px_0_0_rgba(6,182,212,0.95)]'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-accent' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {item.name}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="space-y-4 border-t border-slate-800/80 p-4">
        <div className="rounded-lg border border-slate-800 bg-[#172235]/80 p-4">
          <h3 className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-300">Risk Level Guide</h3>
          <ul className="space-y-2.5 text-xs font-semibold">
            {riskLevels.map(([name, label, color]) => (
              <li key={name} className="flex items-center justify-between gap-3 text-slate-300">
                <span className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  {name}
                </span>
                <span className="text-slate-500">{label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-emerald-400/10 bg-emerald-400/[0.04] px-3.5 py-3 text-xs">
          <span className="font-semibold text-slate-500">System Status</span>
          <span className="flex items-center gap-2 font-bold text-status-safe">
            <span className="h-2 w-2 rounded-full bg-status-safe shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
            Online
          </span>
        </div>
      </div>
    </aside>
  );
};
