import React, { useState } from 'react';
import { Team, Player } from '../types';

interface BidTimerProps {
  secondsRemaining?: number;
  totalDuration?: number;
  isActive?: boolean;
  isPaused?: boolean;
  highestBidder?: Team | null;
  currentBid?: number;
  currentPlayer?: Player | null;
  auctionStatus?: 'idle' | 'bidding' | 'paused' | 'sold' | 'unsold' | 'complete';
  currency?: string;
  onHammerStrike?: () => void;
  onMarkUnsold?: () => void;
}

export const BidTimer: React.FC<BidTimerProps> = ({
  highestBidder,
  currentBid = 0,
  currentPlayer,
  auctionStatus = 'idle',
  currency = '₹',
  onHammerStrike,
  onMarkUnsold
}) => {
  const [isStriking, setIsStriking] = useState(false);

  const canHammerSold = Boolean(currentPlayer && highestBidder && currentBid > 0 && auctionStatus !== 'sold');
  const canMarkUnsold = Boolean(currentPlayer && auctionStatus !== 'sold' && auctionStatus !== 'unsold');

  const handleHammerClick = () => {
    if (!canHammerSold || !onHammerStrike) return;
    setIsStriking(true);
    setTimeout(() => {
      setIsStriking(false);
      onHammerStrike();
    }, 180);
  };

  return (
    <div className="w-full">
      <div className="p-4 bg-[#1E1E38] border-2 border-[#D4AF37] text-[#FFFDF9] shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          {/* Interactive Ceremonial Hammer Logo Button */}
          <button
            type="button"
            onClick={handleHammerClick}
            disabled={!canHammerSold}
            title={
              canHammerSold
                ? `Strike Hammer to sell ${currentPlayer?.name} to ${highestBidder?.name} for ${currency}${currentBid.toLocaleString()}`
                : 'Place at least one bid to strike the Hammer'
            }
            className={`group relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex flex-col items-center justify-center border-2 transition-all duration-200 select-none ${
              canHammerSold
                ? 'bg-gradient-to-b from-[#D4AF37] via-[#c59b27] to-[#997819] border-[#FFFDF9] text-[#0F172A] cursor-pointer shadow-[0_0_25px_rgba(212,175,55,0.55)] hover:scale-105 active:scale-95'
                : 'bg-[#151934] border-[#D4AF37]/40 text-[#D4AF37]/50 cursor-not-allowed'
            }`}
          >
            {/* Custom Ceremonial Auction Hammer & Soundblock SVG Logo */}
            <svg
              viewBox="0 0 64 64"
              className={`w-11 h-11 sm:w-12 sm:h-12 transition-transform duration-150 ${
                isStriking
                  ? '-rotate-45 translate-y-1 scale-110'
                  : canHammerSold
                  ? 'group-hover:-rotate-12'
                  : ''
              }`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Soundblock Anvil Base */}
              <path
                d="M10 52H36L33 46H13L10 52Z"
                fill="currentColor"
                fillOpacity="0.9"
              />
              <rect
                x="8"
                y="52"
                width="30"
                height="4"
                rx="1"
                fill="currentColor"
              />
              {/* Impact Spark Lines when active */}
              {canHammerSold && (
                <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="14" y1="41" x2="10" y2="37" />
                  <line x1="23" y1="39" x2="23" y2="34" />
                  <line x1="31" y1="41" x2="35" y2="37" />
                </g>
              )}
              {/* Hammer Handle */}
              <path
                d="M31 27L54 50"
                stroke="currentColor"
                strokeWidth="5.5"
                strokeLinecap="round"
              />
              {/* Hammer Mallet Head */}
              <g transform="rotate(-45 27 23)">
                <rect
                  x="13"
                  y="16"
                  width="28"
                  height="14"
                  rx="2.5"
                  fill="currentColor"
                />
                <rect
                  x="10"
                  y="14.5"
                  width="5"
                  height="17"
                  rx="1.5"
                  fill="currentColor"
                />
                <rect
                  x="39"
                  y="14.5"
                  width="5"
                  height="17"
                  rx="1.5"
                  fill="currentColor"
                />
              </g>
            </svg>
            <span className="font-storybook font-black text-[10px] uppercase tracking-[0.12em] mt-1">
              {auctionStatus === 'sold' ? 'SOLD!' : 'HAMMER'}
            </span>
          </button>

          {/* Right Side Manual Hammer Instructions & Action */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-storybook font-bold uppercase tracking-[0.1em] text-[#D4AF37]">
                MANUAL AUCTIONEER HAMMER
              </span>
              <span className="text-[10px] font-storybook uppercase tracking-wider text-emerald-300">
                No Timer · Manual Control
              </span>
            </div>

            {auctionStatus === 'sold' ? (
              <div className="text-xs font-storybook font-bold text-emerald-300">
                HAMMER DROPPED! Sold to {highestBidder?.name} for {currency}{currentBid.toLocaleString()}
              </div>
            ) : canHammerSold ? (
              <div>
                <div className="text-xs sm:text-sm font-display font-black text-white leading-snug">
                  Click Hammer Logo to Sell to{' '}
                  <span className="text-[#D4AF37]">{highestBidder?.shortCode}</span> for{' '}
                  <span className="text-emerald-300">
                    {currency}
                    {currentBid.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleHammerClick}
                    className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#e5c247] text-[#0F172A] font-storybook font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-sm"
                  >
                    🔨 Strike Hammer (Complete Bid)
                  </button>
                </div>
              </div>
            ) : currentPlayer ? (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-300 font-body">
                  Place a bid below, then click the <strong className="text-[#D4AF37]">Hammer Logo</strong> when bidding is complete.
                </p>
                {onMarkUnsold && canMarkUnsold && (
                  <button
                    type="button"
                    onClick={onMarkUnsold}
                    className="px-3 py-1 bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-400/50 font-storybook font-bold text-[11px] uppercase tracking-wider transition cursor-pointer"
                  >
                    Pass Lot Unsold
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic font-body">
                Commence the auction to bring a player to the stage.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
