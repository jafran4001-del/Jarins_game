import React from 'react';
import { HousePart, PlayerStats } from '../types/game';
import { HOUSE_PARTS } from '../data/gameData';
import { sound } from '../services/sound';
import confetti from 'canvas-confetti';
import { ArrowLeft, Play, Hammer, Home, BedDouble, Shield, Waves, Palmtree, Sparkles, CheckCircle2 } from 'lucide-react';

interface HouseBuilderProps {
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onPlay: () => void;
  onBack: () => void;
}

export const HouseBuilder: React.FC<HouseBuilderProps> = ({
  stats,
  onUpdateStats,
  onPlay,
  onBack,
}) => {
  // Calculate total upgrades completed
  let totalUpgrades = 0;
  const maxPossibleUpgrades = HOUSE_PARTS.length * 5; // 30

  HOUSE_PARTS.forEach(part => {
    totalUpgrades += stats.houseUpgrades[part.id] || 0;
  });

  const progressPercent = Math.round((totalUpgrades / maxPossibleUpgrades) * 100);

  const getPartIcon = (iconName: string) => {
    switch (iconName) {
      case 'Hammer':
        return <Hammer className="w-6 h-6 text-amber-500" />;
      case 'Home':
        return <Home className="w-6 h-6 text-blue-500" />;
      case 'BedDouble':
        return <BedDouble className="w-6 h-6 text-purple-500" />;
      case 'Shield':
        return <Shield className="w-6 h-6 text-red-500" />;
      case 'Waves':
        return <Waves className="w-6 h-6 text-cyan-500" />;
      case 'Palmtree':
        return <Palmtree className="w-6 h-6 text-emerald-500" />;
      default:
        return <Hammer className="w-6 h-6 text-amber-500" />;
    }
  };

  const handleUpgrade = (part: HousePart) => {
    const currentLvl = stats.houseUpgrades[part.id] || 0;
    if (currentLvl >= part.maxLevel) return;

    const cost = part.costPerLevel[currentLvl];
    if (stats.gold < cost) {
      sound.playCrash();
      return;
    }

    const updatedGold = stats.gold - cost;
    const updatedHouse = {
      ...stats.houseUpgrades,
      [part.id]: currentLvl + 1,
    };

    onUpdateStats({
      ...stats,
      gold: updatedGold,
      houseUpgrades: updatedHouse,
    });

    sound.playFanfare();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Lobby</span>
        </button>

        <h1 className="text-lg sm:text-xl font-extrabold text-amber-400 tracking-wide font-sans flex items-center gap-2">
          <Sparkles className="w-5 h-5 fill-amber-400" />
          Tom&apos;s Dream Villa
        </h1>

        <div className="flex items-center gap-3">
          {/* Gold Balance */}
          <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl px-3 py-1 flex items-center gap-2 text-amber-300 font-bold font-mono text-sm sm:text-base">
            <span className="text-xs uppercase bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded">GOLD</span>
            {stats.gold.toLocaleString()}
          </div>

          <button
            onClick={onPlay}
            className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-extrabold px-4 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 text-sm transition-all"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Run</span>
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* House Showcase Hero Card */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="aspect-[16/9] sm:aspect-[21/9] w-full relative overflow-hidden max-h-72">
            <img
              src="/src/assets/images/dream_house_preview_1791699057939.jpg"
              alt="Tom's Dream House"
              className="w-full h-full object-cover brightness-95"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
                  Renovation Project
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Talking Tom&apos;s Mansion</h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Build and decorate to permanently increase your in-game Score Multiplier!
                </p>
              </div>

              {/* Multiplier Perk Badge */}
              <div className="bg-amber-500 text-slate-950 font-black px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 shrink-0">
                <span className="text-2xl font-mono leading-none">+{totalUpgrades}x</span>
                <div className="text-[10px] uppercase leading-tight font-extrabold">
                  Score
                  <br />
                  Multiplier
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="p-4 sm:p-6 bg-slate-900/50 border-t border-white/5 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400">Total Construction Completion</span>
              <span className="text-amber-400 font-mono">
                {totalUpgrades} / {maxPossibleUpgrades} Upgrades ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Renovation Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HOUSE_PARTS.map(part => {
            const currentLevel = stats.houseUpgrades[part.id] || 0;
            const isMax = currentLevel >= part.maxLevel;
            const nextCost = !isMax ? part.costPerLevel[currentLevel] : 0;
            const canAfford = !isMax && stats.gold >= nextCost;

            return (
              <div
                key={part.id}
                className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
                  isMax
                    ? 'bg-slate-900/40 border-emerald-500/30 shadow-sm'
                    : 'bg-slate-900/90 border-white/10 hover:border-amber-400/30'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 shrink-0">
                      {getPartIcon(part.icon)}
                    </div>

                    {/* Level Stars / Bars */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: part.maxLevel }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-3.5 h-3.5 rounded-sm transition-all ${
                            i < currentLevel
                              ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                              : 'bg-slate-800 border border-white/10'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="font-bold text-base sm:text-lg text-white mt-3">{part.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{part.description}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Perk</span>
                    <p className="text-xs font-semibold text-emerald-400">+{currentLevel}x Score Boost</p>
                  </div>

                  {isMax ? (
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>COMPLETED</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(part)}
                      disabled={!canAfford}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all active:scale-95 ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      <Hammer className="w-3.5 h-3.5" />
                      <span>{nextCost.toLocaleString()} Gold</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
