'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  delay?: number;
}

export default function StatsCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  delay = 0 
}: StatsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-white/70">{title}</h3>
        {icon && <div className="text-white/50">{icon}</div>}
      </div>
      
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-white">{value}</div>
        
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${
            isPositive ? 'text-green-400' : 
            isNegative ? 'text-red-400' : 
            'text-white/70'
          }`}>
            {isPositive && <TrendingUp size={14} />}
            {isNegative && <TrendingDown size={14} />}
            <span>
              {change > 0 ? '+' : ''}{change.toFixed(2)}%
            </span>
            {changeLabel && (
              <span className="text-white/50 ml-1">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
