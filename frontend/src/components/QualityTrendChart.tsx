import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQualityTrend } from '../services/dashboardData';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded border border-slate-700/80 bg-[#111a2b]/95 p-3 shadow-xl backdrop-blur">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Time: {label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 text-xs font-bold">
            <span style={{ color: entry.color }} className="capitalize">{entry.name}</span>
            <span className="text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const QualityTrendChart: React.FC = () => {
  const { data, loading } = useQualityTrend();
  const [activeMetric, setActiveMetric] = useState<'turbidity' | 'chlorine'>('turbidity');

  return (
    <div className="flex h-full min-h-[220px] flex-col rounded-lg border border-slate-800 bg-surface/90 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-200">Water Quality</h3>
          <span className="rounded border border-slate-600/50 bg-slate-800/50 px-2 py-0.5 text-[9px] font-bold tracking-widest text-slate-400">DEMO</span>
        </div>
        
        <div className="flex rounded bg-black/20 p-1">
          <button 
            onClick={() => setActiveMetric('turbidity')}
            className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition ${activeMetric === 'turbidity' ? 'bg-status-warning/20 text-status-warning' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Turbidity
          </button>
          <button 
            onClick={() => setActiveMetric('chlorine')}
            className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition ${activeMetric === 'chlorine' ? 'bg-accent/20 text-accent' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Chlorine
          </button>
        </div>
      </div>
      
      <div className="min-h-0 flex-1 relative mt-2">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-500">
            Loading trend data...
          </div>
        ) : !data || data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-500">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTurbidity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorChlorine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />
              
              {activeMetric === 'turbidity' && (
                <Area 
                  type="monotone" 
                  dataKey="turbidity" 
                  name="Turbidity (NTU)"
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorTurbidity)" 
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              )}
              {activeMetric === 'chlorine' && (
                <Area 
                  type="monotone" 
                  dataKey="chlorine" 
                  name="Chlorine (mg/L)"
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorChlorine)" 
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
