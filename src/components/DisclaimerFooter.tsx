import React from 'react';

export const DisclaimerFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#1E1E38] text-[#FFFDF9] border-t-2 border-[#D4AF37]/40 py-10 px-4 sm:px-8 text-center text-xs mt-auto font-body">
      <div className="max-w-5xl mx-auto space-y-3">
        <div className="flex items-center justify-center gap-2 text-[#D4AF37] font-storybook font-bold text-sm uppercase tracking-[0.06em]">
          <span>🏏</span>
          <span>DPL CRICKET AUCTION CHRONICLE · ANNO DOMINI 2026</span>
          <span>🏏</span>
        </div>

        <p className="max-w-2xl mx-auto text-xs leading-relaxed text-[#FFFDF9]/80 italic">
          Fan-made cricket player auction chronicle and tactical simulator for entertainment and strategic simulation purposes.
          Not affiliated with, sponsored by, or endorsed by the IPL, BCCI, or any commercial cricket franchise.
          All team heralds, emblems, and fictional roster profiles are original creations.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-[#D4AF37]/80 font-storybook">
          <span>Real-time Rival AI Strategy</span>
          <span>·</span>
          <span>Treasury Management</span>
          <span>·</span>
          <span>Single-Page Chapter Navigation</span>
        </div>
      </div>
    </footer>
  );
};
