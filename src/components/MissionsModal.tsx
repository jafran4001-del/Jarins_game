import React from 'react';
import { Mission, PlayerStats } from '../types/game';
import { sound } from '../services/sound';
import confetti from 'canvas-confetti';
import { X, CheckCircle2, Gift } from 'lucide-react';

interface MissionsModalProps {
  missions: Mission[];
  stats: PlayerStats;
  onUpdateMissions: (updated: Mission[]) => void;
  onUpdateStats: (newStats: PlayerStats) => void;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  missions,
  stats,
  onUpdateMissions,
  onUpdateStats,
  onClose,
}) => {
  const handleClaim = (mission: Mission) => {
    if (!mission.completed || mission.claimed) return;

    const updatedMissions = missions.map(m =>
      m.id === mission.id ? { ...m, claimed: true } : m
    );

    const updatedStats = {
      ...stats,
      gold: stats.gold + mission.rewardGold,
      diamonds: stats.diamonds + mission.rewardDiamonds,
    };

    onUpdateMissions(updatedMissions);
    onUpdateStats(updatedStats);

    sound.playFanfare();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-black text-white">Daily Missions</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
          {missions.map(mission => {
            const isFinished = mission.current >= mission.target;
            const pct = Math.min(100, Math.round((mission.current / mission.target) * 100));

            return (
              <div
                key={mission.id}
                className="bg-slate-950/80 border border-white/5 rounded-2xl p-4 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white">{mission.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs font-mono">
                      <span className="text-amber-400 font-bold">+{mission.rewardGold} Gold</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-cyan-400 font-bold">+{mission.rewardDiamonds} Diamonds</span>
                    </div>
                  </div>

                  {mission.claimed ? (
                    <span className="text-[11px] font-black uppercase text-slate-500 bg-slate-900 px-2.5 py-1 rounded-lg">
                      CLAIMED
                    </span>
                  ) : isFinished ? (
                    <button
                      onClick={() => handleClaim(mission)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-xs font-black rounded-xl shadow-md active:scale-95 transition-all"
                    >
                      CLAIM
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-mono">
                      {mission.current} / {mission.target}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isFinished ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
