import React from 'react';
import { useNavigate } from 'react-router-dom';
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

export const Sidebar: React.FC<SidebarProps> = ({ activePage }) => {
  const navigate = useNavigate();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-800/60 bg-[#0f1829]">
      {/* Logo / Brand */}
      <button
        onClick={() => navigate('/dashboard')}
        className="group flex w-full items-center gap-3.5 border-b border-slate-800/60 px-6 py-5 text-left transition-colors duration-200 hover:bg-white/[0.02]"
        aria-label="Go to Dashboard"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent font-bold text-[13px] tracking-tight text-background shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-shadow duration-200 group-hover:shadow-[0_0_28px_rgba(6,182,212,0.35)]">
          AM
        </span>
        <div className="min-w-0">
          <h1 className="flex items-center gap-1.5 text-[17px] font-bold tracking-[-0.01em] text-slate-100">
            Alto<span className="text-accent">Mare</span>
          </h1>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Ops Console</p>
        </div>
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => navigate(`/${item.id}`)}
                className={`group relative flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-accent/[0.08] text-accent shadow-[inset_3px_0_0_rgba(6,182,212,0.9)]'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`h-[16px] w-[16px] shrink-0 transition-colors duration-200 ${isActive ? 'text-accent' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {item.name}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="space-y-3 border-t border-slate-800/60 p-3">
        <div className="rounded-lg border border-slate-800/60 bg-[#111a2b]/60 p-3.5">
          <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Risk Level Guide</h3>
          <ul className="space-y-2 text-[11px]">
            {riskLevels.map(([name, label, color]) => (
              <li key={name} className="flex items-center justify-between gap-3 text-slate-300">
                <span className="flex items-center gap-2 font-medium">
                  <span className={`h-2 w-2 rounded-full ${color}`} />
                  {name}
                </span>
                <span className="text-slate-500 font-normal">{label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-emerald-400/10 bg-emerald-400/[0.03] px-3.5 py-2.5 text-[11px]">
          <span className="font-medium text-slate-500">System</span>
          <span className="flex items-center gap-1.5 font-semibold text-status-safe">
            <span className="h-1.5 w-1.5 rounded-full bg-status-safe shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
            Online
          </span>
        </div>
      </div>
    </aside>
  );
};
