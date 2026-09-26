import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player, Team } from '../types';
import { TeamBadge } from './TeamBadge';
import { PlayerAvatar } from './PlayerAvatar';
import { Award, ArrowRight, X, RotateCcw } from 'lucide-react';

interface SoldModalProps {
  player: Player | null;
  winningTeam: Team | null;
  soldPrice: number;
  isOpen: boolean;
  onClose: () => void;
  onNextPlayer: () => void;
  onCancelSale?: () => void;
  currency?: string;
}

export const SoldModal: React.FC<SoldModalProps> = ({
  player,
  winningTeam,
  soldPrice,
  isOpen,
  onClose,
  onNextPlayer,
  onCancelSale,
  currency = '₹'
}) => {
  useEffect(() => {
    if (isOpen && winningTeam) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6, x: 0.3 },
          colors: ['#D4AF37', '#1E1E38', '#0F172A', '#FAFAF8']
        });
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6, x: 0.7 },
          colors: ['#D4AF37', '#1E1E38', '#0F172A', '#FAFAF8']
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isOpen, winningTeam]);

  if (!isOpen || !player || !winningTeam) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#FFFDF9] border-2 border-[#D4AF37] p-6 sm:p-8 shadow-2xl text-center rounded-none font-body text-[#0F172A]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-[#F5F2EB] text-[#475569] transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Title */}
        <div className="flex items-center justify-center gap-2 mb-2 text-[#D4AF37] font-storybook font-bold text-xs uppercase tracking-[0.1em]">
          <span>✦</span>
          <span>THE GAVEL HAS FALLEN</span>
          <span>✦</span>
        </div>

        <h2 className="text-4xl sm:text-5xl font-display font-black text-[#0F172A] tracking-[0.05em] uppercase leading-none">
          OFFICIALLY SOLD!
        </h2>

        {/* Central Player Showcase */}
        <div className="my-6 flex flex-col items-center">
          <div className="p-3 bg-[#FAFAF8] border border-[#D4AF37]/50 shadow-sm mb-3">
            <PlayerAvatar player={player} size="lg" />
          </div>

          <h3 className="text-2xl font-display font-black text-[#0F172A] tracking-[0.04em]">
            {player.name}
          </h3>
          <p className="text-sm text-[#475569] italic">
            {player.role} · Age {player.age}
          </p>
        </div>

        {/* Winning Franchise Box */}
        <div className="p-4 bg-[#FAFAF8] border border-[#D4AF37]/40 mb-6 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <TeamBadge team={winningTeam} size="md" />
            <div>
              <span className="text-[10px] uppercase font-storybook font-bold tracking-wider text-[#997819] block">
                ACQUIRING CLUB
              </span>
              <strong className="font-storybook text-base text-[#0F172A]">
                {winningTeam.name}
              </strong>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-storybook font-bold tracking-wider text-[#475569] block">
              FINAL HAMMER SUM
            </span>
            <strong className="font-storybook font-black text-2xl text-[#0F172A] block">
              {currency}{soldPrice.toLocaleString()}
            </strong>
            <span className="text-[11px] font-storybook font-bold text-emerald-700 block mt-0.5">
              Remaining Treasury: {currency}{winningTeam.purse.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              onClose();
              onNextPlayer();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] hover:bg-[#b89528] text-[#0F172A] font-storybook font-black text-xs uppercase tracking-[0.06em] border border-[#D4AF37] transition cursor-pointer rounded-none shadow-sm"
          >
            <span>PROCEED TO NEXT LOT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
