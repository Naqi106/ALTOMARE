import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useNRWTrend } from '../services/dashboardData';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded border border-slate-700/80 bg-[#111a2b]/95 p-3 shadow-xl backdrop-blur">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-sm font-black text-status-critical">
          Loss: {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

export const NRWTrendChart: React.FC = () => {
  const { data, loading } = useNRWTrend();

  return (
    <div className="flex h-full min-h-[220px] flex-col rounded-lg border border-slate-800 bg-surface/90 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-200">NRW Trend</h3>
        <span className="rounded border border-slate-600/50 bg-slate-800/50 px-2 py-0.5 text-[9px] font-bold tracking-widest text-slate-400">DEMO</span>
      </div>
      
      <div className="min-h-0 flex-1 relative">
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
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => val.split('-').slice(1).join('/')}
              />
              <YAxis 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 1', 'dataMax + 1']}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#ef4444" 
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
