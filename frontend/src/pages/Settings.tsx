import React, { useState } from 'react';
import {
  Monitor,
  Bell,
  Database,
  Palette,
  Info,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [refreshDisplay] = useState('15 seconds');

  const settingsSections = [
    {
      title: 'Dashboard Appearance',
      icon: Monitor,
      items: [
        { label: 'Theme', value: 'Dark (Command Center)', description: 'Dark theme optimized for operations monitoring' },
        { label: 'Layout Density', value: 'Comfortable', description: 'Balanced spacing for desktop displays' },
        { label: 'Map Style', value: 'CARTO Dark (No Labels)', description: 'CartoDB dark tile layer for zone visualization' },
      ],
    },
    {
      title: 'Alert Configuration',
      icon: Bell,
      items: [
        { label: 'Polling Interval', value: refreshDisplay, description: 'Live alerts refresh rate from GET /alerts' },
        { label: 'Alert Source', value: 'Live (Backend API)', description: 'Connected to the alerts service endpoint' },
        { label: 'High-Loss Threshold', value: '100,000 L', description: 'Frontend visual severity threshold (demo rule)' },
      ],
    },
    {
      title: 'Data Sources',
      icon: Database,
      items: [
        { label: 'Zones', value: 'LIVE', valueBadge: 'live', description: 'GET /zones — connected to backend' },
        { label: 'Alerts', value: 'LIVE', valueBadge: 'live', description: 'GET /alerts — connected with 15s polling' },
        { label: 'NRW Trend', value: 'DEMO', valueBadge: 'demo', description: 'Demo adapter — no historical GET endpoint' },
        { label: 'Water Quality', value: 'DEMO', valueBadge: 'demo', description: 'Demo adapter — no historical GET endpoint' },
        { label: 'Revenue', value: 'LIVE', valueBadge: 'live', description: 'GET /revenue/summary — connected to backend' },
        { label: 'Correlation', value: 'LIVE', valueBadge: 'live', description: 'GET /correlation/{zone_id} — connected to backend' },
      ],
    },
    {
      title: 'Interface Preferences',
      icon: Palette,
      items: [
        { label: 'Animations', value: 'Enabled', description: 'Subtle micro-interactions and transitions' },
        { label: 'Notification Panel', value: 'Bell icon (top bar)', description: 'Click bell to view recent alerts' },
        { label: 'Sidebar', value: 'Fixed (256px)', description: 'Persistent navigation sidebar' },
      ],
    },
  ];

  return (
    <div className="h-full overflow-auto p-5 xl:p-6 custom-scrollbar">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="mt-1 text-sm text-slate-400">Dashboard configuration and data source status</p>
        </div>
      </div>

      {/* Read-only notice */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-accent/20 bg-accent/[0.04] p-4">
        <Info className="h-4 w-4 shrink-0 text-accent mt-0.5" />
        <div>
          <p className="text-sm font-medium text-slate-200">Frontend configuration overview</p>
          <p className="mt-1 text-xs text-slate-400">
            These settings reflect the current frontend configuration. Backend settings management
            and user authentication will be available in a future release.
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {settingsSections.map(section => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="rounded-lg border border-slate-800/60 bg-surface/80 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Icon className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold text-white">{section.title}</h2>
              </div>
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-4 rounded-md px-3 py-3 transition-colors duration-150 hover:bg-white/[0.02]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200">{item.label}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{item.description}</p>
                    </div>
                    <div className="shrink-0">
                      {'valueBadge' in item && item.valueBadge ? (
                        <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          item.valueBadge === 'live'
                            ? 'border border-accent/30 bg-accent/10 text-accent'
                            : 'border border-slate-600/50 bg-slate-800/50 text-slate-400'
                        }`}>
                          {item.value}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-slate-300">{item.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
