import React from 'react';
import type { RiskLevel } from '../types';
import { getStatusBgColor } from '../utils/status';

interface StatusBadgeProps {
  status: RiskLevel | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const bgColor = getStatusBgColor(status as RiskLevel);
  
  return (
    <span className={`inline-flex items-center rounded px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-background shadow-sm ${bgColor}`}>
      {status}
    </span>
  );
};
