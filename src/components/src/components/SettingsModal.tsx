import React from 'react';
import { AuctionSettings } from '../types';
import { Sliders, Volume2, VolumeX, Zap, Timer, Cpu, Sparkles, X, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AuctionSettings;
  onUpdateSettings: (newSettings: Partial<AuctionSettings>) => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetDefaults
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#090d16] border border-slate-700/80 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="font-score font-black text-lg text-white tracking-wide">
              AUCTION SIMULATION SETTINGS
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4 text-xs">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2.5">
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <div>
                <span className="font-bold text-white block">Broadcast Sound Effects</span>
                <span className="text-slate-400 text-[11px]">Gavel strike, bids chime, and warning countdown</span>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${
                settings.soundEnabled ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-black transition-transform ${
                  settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Animations Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <div>
                <span className="font-bold text-white block">Visual Confetti & Beam Animations</span>
                <span className="text-slate-400 text-[11px]">Celebratory effects for sold lots</span>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ animationsEnabled: !settings.animationsEnabled })}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${
                settings.animationsEnabled ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-black transition-transform ${
                  settings.animationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Manual Hammer Control */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white">Manual Auctioneer Hammer</span>
              </div>
              <span className="font-score text-emerald-400 font-bold uppercase text-[11px]">Active (No Timer)</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Countdown timer is disabled. Click the Hammer Logo on the auction stage to manually strike the gavel and complete the bid.
            </p>
          </div>

          {/* AI Difficulty & Aggression */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-white">AI Bidding Aggression</span>
              </div>
              <span className="capitalize font-score text-amber-400 font-bold">{settings.aiDifficulty}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['conservative', 'balanced', 'aggressive'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => onUpdateSettings({ aiDifficulty: diff })}
                  className={`py-1.5 rounded-lg font-score font-bold capitalize transition ${
                    settings.aiDifficulty === diff
                      ? 'bg-amber-500 text-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Pacing Speed */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">Simulation Pacing</span>
              </div>
              <span className="capitalize font-score text-amber-400 font-bold">{settings.auctionSpeed}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['slow', 'normal', 'fast'] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => onUpdateSettings({ auctionSpeed: spd })}
                  className={`py-1.5 rounded-lg font-score font-bold capitalize transition ${
                    settings.auctionSpeed === spd
                      ? 'bg-amber-500 text-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {spd}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 text-black font-score font-bold text-xs uppercase hover:bg-amber-400 transition"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
