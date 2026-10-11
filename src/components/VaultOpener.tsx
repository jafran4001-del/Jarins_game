import React, { useState } from 'react';
import { PlayerStats } from '../types/game';
import { sound } from '../services/sound';
import confetti from 'canvas-confetti';
import { ArrowLeft, Play, Package, Sparkles, Diamond, Bomb, Lock } from 'lucide-react';

interface VaultOpenerProps {
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onPlay: () => void;
  onBack: () => void;
}

interface VaultReward {
  gold: number;
  diamonds: number;
  dynamite: number;
}

export const VaultOpener: React.FC<VaultOpenerProps> = ({
  stats,
  onUpdateStats,
  onPlay,
  onBack,
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const [openedReward, setOpenedReward] = useState<VaultReward | null>(null);

  const openCommonSafe = () => {
    if (stats.gold < 200 || isOpening) {
      sound.playCrash();
      return;
    }

    setIsOpening(true);
    sound.playPowerUp();

    setTimeout(() => {
      const rewardGold = Math.floor(250 + Math.random() * 350);
      const rewardDiamonds = Math.floor(2 + Math.random() * 4);
      const rewardDynamite = Math.random() < 0.25 ? 1 : 0;

      const updatedStats = {
        ...stats,
        gold: stats.gold - 200 + rewardGold,
        diamonds: stats.diamonds + rewardDiamonds,
        dynamite: stats.dynamite + rewardDynamite,
      };

      onUpdateStats(updatedStats);
      setOpenedReward({
        gold: rewardGold,
        diamonds: rewardDiamonds,
        dynamite: rewardDynamite,
      });
      setIsOpening(false);
      sound.playFanfare();
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.55 } });
    }, 1200);
  };

  const openDiamondVault = () => {
    if ((stats.dynamite < 1 && stats.diamonds < 15) || isOpening) {
      sound.playCrash();
      return;
    }

    setIsOpening(true);
    sound.playPowerUp();

    setTimeout(() => {
      const useDynamite = stats.dynamite >= 1;
      const rewardGold = Math.floor(1000 + Math.random() * 1500);
      const rewardDiamonds = Math.floor(12 + Math.random() * 15);
      const rewardDynamite = Math.floor(1 + Math.random() * 2);

      const updatedStats = {
        ...stats,
        gold: stats.gold + rewardGold,
        diamonds: useDynamite ? stats.diamonds + rewardDiamonds : stats.diamonds - 15 + rewardDiamonds,
        dynamite: useDynamite ? stats.dynamite - 1 + rewardDynamite : stats.dynamite + rewardDynamite,
      };

      onUpdateStats(updatedStats);
      setOpenedReward({
        gold: rewardGold,
        diamonds: rewardDiamonds,
        dynamite: rewardDynamite,
      });
      setIsOpening(false);
      sound.playFanfare();
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } });
    }, 1400);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Lobby</span>
        </button>

        <h1 className="text-lg sm:text-xl font-extrabold text-amber-400 tracking-wide font-sans flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-400" />
          Secret Vaults
        </h1>

        <div className="flex items-center gap-3">
          {/* Inventory Pill */}
          <div className="flex items-center gap-2 bg-slate-900/80 border border-white/10 rounded-xl px-3 py-1 font-mono text-xs sm:text-sm">
            <span className="text-amber-400 font-bold">{stats.gold.toLocaleString()} G</span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-400 font-bold">{stats.diamonds} D</span>
            <span className="text-slate-600">·</span>
            <span className="text-red-400 font-bold">{stats.dynamite} TNT</span>
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

      {/* Main Vaults Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-8 flex flex-col justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Crack Open Roy Rakoon&apos;s Loot Safes!</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Safes drop massive caches of recovered gold bullion, sparkling diamonds, and sticks of dynamite.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Common Safe */}
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-xl relative overflow-hidden">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 shadow-2xl flex items-center justify-center mb-5 relative">
              <Package className="w-14 h-14 text-amber-400" />
              <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none" />
            </div>

            <h3 className="text-xl font-black text-white">Iron Bandit Safe</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Contains 250 - 600 Gold Bars and up to 5 sparkling Diamonds!
            </p>

            <div className="my-6 flex items-center gap-3 text-xs font-bold text-slate-300">
              <span className="bg-slate-800 px-3 py-1 rounded-lg border border-white/5">Cost: 200 Gold</span>
            </div>

            <button
              onClick={openCommonSafe}
              disabled={stats.gold < 200 || isOpening}
              className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                stats.gold >= 200 && !isOpening
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              {isOpening ? 'CRACKING SAFE...' : 'OPEN WITH 200 GOLD'}
            </button>
          </div>

          {/* Diamond Vault */}
          <div className="bg-gradient-to-b from-slate-900 to-cyan-950/30 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-xl relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-cyan-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              JACKPOT
            </div>

            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-cyan-900 to-slate-900 border-2 border-cyan-400 shadow-2xl shadow-cyan-500/20 flex items-center justify-center mb-5 relative">
              <Diamond className="w-14 h-14 text-cyan-300 fill-cyan-400/20 animate-pulse" />
              <div className="absolute inset-0 border border-cyan-300/20 rounded-2xl pointer-events-none" />
            </div>

            <h3 className="text-xl font-black text-white">Diamond Royal Vault</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Contains 1,000 - 2,500 Gold, 15+ Diamonds, and extra Dynamite!
            </p>

            <div className="my-6 flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="bg-slate-800 px-3 py-1 rounded-lg border border-white/5 flex items-center gap-1 text-red-400">
                <Bomb className="w-3.5 h-3.5" /> 1 Dynamite OR 15 Diamonds
              </span>
            </div>

            <button
              onClick={openDiamondVault}
              disabled={(stats.dynamite < 1 && stats.diamonds < 15) || isOpening}
              className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                (stats.dynamite >= 1 || stats.diamonds >= 15) && !isOpening
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-lg shadow-cyan-400/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              {isOpening ? 'BLASTING VAULT...' : stats.dynamite >= 1 ? 'BLAST WITH 1 DYNAMITE' : 'UNLOCK (15 DIAMONDS)'}
            </button>
          </div>
        </div>
      </div>

      {/* Rewards Reveal Modal */}
      {openedReward && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-400/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-amber-400/20 border border-amber-400/40 rounded-2xl mx-auto flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-amber-400" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">Vault Unlocked!</h3>
              <p className="text-xs text-slate-400 mt-1">Here is what was found inside:</p>
            </div>

            <div className="space-y-2.5 bg-slate-950/70 p-4 rounded-2xl border border-white/5 text-left text-sm font-bold font-mono">
              <div className="flex justify-between items-center text-amber-400">
                <span>Gold Bullion</span>
                <span>+{openedReward.gold.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-cyan-400">
                <span>Sparkling Diamonds</span>
                <span>+{openedReward.diamonds}</span>
              </div>
              {openedReward.dynamite > 0 && (
                <div className="flex justify-between items-center text-red-400">
                  <span>TNT Dynamite</span>
                  <span>+{openedReward.dynamite}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setOpenedReward(null)}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-sm transition-all"
            >
              COLLECT REWARDS
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
