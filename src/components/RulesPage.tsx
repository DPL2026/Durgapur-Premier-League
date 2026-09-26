import React from 'react';
import { BookOpen, DollarSign, Users, Plane, Gavel, Cpu, CheckCircle, Repeat } from 'lucide-react';

interface RulesPageProps {
  initialPurse?: number;
  maxSquadSize?: number;
  maxOverseasPlayers?: number;
  currency?: string;
  bidTimerDuration?: number;
}

export const RulesPage: React.FC<RulesPageProps> = ({
  initialPurse = 60000,
  maxSquadSize = 18,
  maxOverseasPlayers = 6,
  currency = '₹',
  bidTimerDuration = 10
}) => {
  const ruleCards = [
    {
      title: 'FRANCHISE PURSE & ROYAL TREASURY',
      icon: <DollarSign className="w-5 h-5 text-[#997819]" />,
      content: [
        `Each franchise commands a total opening purse of ${currency}${initialPurse.toLocaleString()}.`,
        `Retained stars deduct their contract values directly from the club treasury prior to the auction.`,
        `Deficit spending is unlawful. Budget preservation rules mandate sufficient remaining funds to fulfill minimum base reserves for remaining squad quotas.`
      ]
    },
    {
      title: 'SQUAD QUOTA & ROSTER CAP',
      icon: <Users className="w-5 h-5 text-[#1E1E38]" />,
      content: [
        `Maximum squad size is strictly capped at ${maxSquadSize} players per franchise.`,
        `Once a club completes its quota of ${maxSquadSize} players, its bidding paddle is officially lowered for the season.`,
        `Squads must balance their roster across Batters, All-rounders, Keepers, and Bowlers.`
      ]
    },
    {
      title: 'ALL-INDIAN DOMESTIC TALENT (DPL)',
      icon: <Users className="w-5 h-5 text-[#997819]" />,
      content: [
        `All players in the DPL are premier Indian domestic cricketers representing states and regions.`,
        `No overseas player restrictions or visas apply—every franchise drafts from the unified Indian cricket talent pool.`,
        `Teams have total freedom to draft talent across every cricket specialization.`
      ]
    },
    {
      title: 'BID LADDER & INCREMENTS',
      icon: <Gavel className="w-5 h-5 text-[#1E1E38]" />,
      content: [
        `Official base tiers range from ${currency}200 up to ${currency}2,000 marquee lots.`,
        `Standard increments: +${currency}200, +${currency}500, or +${currency}1,000 for heated bidding wars.`,
        `Custom raises can be called provided they exceed the current bid plus minimum mandatory increment.`
      ]
    },
    {
      title: 'MANUAL HAMMER & GAVEL DECREE',
      icon: <CheckCircle className="w-5 h-5 text-[#997819]" />,
      content: [
        `No automatic countdown timer is enforced—bidding remains open as long as franchises contest the lot.`,
        `Once bidding is complete, the auctioneer manually clicks the Hammer Logo to drop the gavel and declare the player SOLD!`,
        `If no club makes an opening offer at base reserve, the lot may be manually passed as UNSOLD.`
      ]
    },
    {
      title: 'ACCELERATED UNSOLD SESSION',
      icon: <Repeat className="w-5 h-5 text-[#1E1E38]" />,
      content: [
        `After regular registry lots conclude, franchises may inaugurate the Accelerated Unsold Session.`,
        `Unsold stars are recalled at discounted base valuations for high-intensity last-minute recruitment.`,
        `All sales are final, bound by the official auction chronicle.`
      ]
    }
  ];

  return (
    <div className="w-full space-y-6 text-[#0F172A]">
      {/* Chapter Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-[#D4AF37] font-storybook font-bold text-xs uppercase tracking-[0.1em]">
          <span>THE LAWS & CODES OF THE GAVEL</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-black tracking-[0.05em] uppercase text-[#0F172A] leading-tight">
          RULES OF ENGAGEMENT & REGULATIONS
        </h2>
        <p className="text-sm font-body italic text-[#475569] max-w-2xl mt-1">
          The codified governance governing franchise purses, international player quotas, bid increments, and hammer protocols.
        </p>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ruleCards.map((card) => (
          <div
            key={card.title}
            className="p-5 bg-[#FAFAF8] border border-[#D4AF37]/40 shadow-sm rounded-none font-body flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 pb-3 border-b border-[#D4AF37]/30 mb-4">
                <div className="w-8 h-8 bg-[#FFFDF9] border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                  {card.icon}
                </div>
                <h3 className="font-storybook font-bold text-xs uppercase tracking-[0.05em] text-[#0F172A]">
                  {card.title}
                </h3>
              </div>

              <ul className="space-y-2.5 text-xs text-[#334155] leading-relaxed">
                {card.content.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#D4AF37] font-storybook font-bold text-xs">§</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
