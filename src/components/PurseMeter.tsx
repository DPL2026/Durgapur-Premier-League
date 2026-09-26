import React from 'react';

interface PurseMeterProps {
  currentPurse: number;
  initialPurse: number;
  label?: string;
  currency?: string;
  compact?: boolean;
}

export const PurseMeter: React.FC<PurseMeterProps> = ({
  currentPurse,
  initialPurse,
  label = 'PURSE TREASURY',
  currency = '₹',
  compact = false
}) => {
  const percentage = Math.max(0, Math.min(100, Math.round((currentPurse / initialPurse) * 100)));

  const getMeterColor = () => {
    if (percentage > 50) return 'bg-[#1E1E38]';
    if (percentage > 25) return 'bg-[#D4AF37]';
    return 'bg-rose-700';
  };

  const getTextColor = () => {
    if (percentage > 50) return 'text-[#0F172A]';
    if (percentage > 25) return 'text-[#997819]';
    return 'text-rose-700';
  };

  if (compact) {
    return (
      <div className="w-full font-body">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[#475569] font-medium tracking-wide">{label}</span>
          <span className={`font-storybook font-bold ${getTextColor()}`}>
            {currency}{currentPurse.toLocaleString()} <span className="text-[#64748B] font-normal">({percentage}%)</span>
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#EFECE4] border border-[#D4AF37]/25 overflow-hidden rounded-none">
          <div
            className={`h-full ${getMeterColor()} transition-all duration-700 rounded-none`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#FAFAF8] border border-[#D4AF37]/35 shadow-sm rounded-none">
      <div className="flex items-center justify-between mb-1.5 font-body">
        <span className="text-xs uppercase tracking-[0.05em] text-[#475569] font-storybook font-bold">{label}</span>
        <span className="text-xs text-[#64748B] font-storybook">{percentage}% Retained</span>
      </div>
      <div className="flex items-baseline gap-2 mb-2 font-body">
        <span className={`text-2xl sm:text-3xl font-storybook font-black tracking-tight ${getTextColor()}`}>
          {currency}{currentPurse.toLocaleString()}
        </span>
        <span className="text-xs text-[#64748B]">
          / {currency}{initialPurse.toLocaleString()} Initial
        </span>
      </div>
      {/* Editorial meter bar */}
      <div className="w-full h-2 bg-[#EFECE4] p-0.5 border border-[#D4AF37]/30 overflow-hidden rounded-none">
        <div
          className={`h-full ${getMeterColor()} transition-all duration-700 ease-out rounded-none`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
