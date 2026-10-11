import React from 'react';
import { RunSummary } from '../types/game';
import { RotateCcw, Home, Bomb, Sparkles, Trophy } from 'lucide-react';

interface GameOverModalProps {
  summary: RunSummary;
  highScore: number;
  dynamiteCount: number;
  onRevive: () => void;
  onRestart: () => void;
  onGoToHouse: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  summary,
  highScore,
  dynamiteCount,
  onRevive,
  onRestart,
  onGoToHouse,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Banner */}
        <div>
          {summary.isNewHighScore ? (
            <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 animate-bounce">
              <Trophy className="w-3.5 h-3.5" /> NEW HIGH SCORE!
            </div>
          ) : (
            <span className="text-xs uppercase tracking-wider font-bold text-red-400 bg-red-950/60 border border-red-500/30 px-3 py-1 rounded-full inline-block mb-2">
              CRASHED!
            </span>
          )}
          <h2 className="text-3xl font-black text-white">Chase Ended</h2>
        </div>

        {/* Score & Stats Grid */}
        <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-400 uppercase font-semibold">Final Score</span>
            <span className="text-4xl font-black text-white font-mono tabular-nums mt-0.5">
              {summary.score.toLocaleString()}
            </span>
          </div>

          <div className="h-px bg-white/10 my-2" />

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Recovered</span>
              <span className="text-amber-400 font-extrabold font-mono text-sm sm:text-base">
                +{summary.goldCollected} G
              </span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Distance</span>
              <span className="text-slate-200 font-extrabold font-mono text-sm sm:text-base">
                {summary.distance}m
              </span>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Thief Hits</span>
              <span className="text-emerald-400 font-extrabold font-mono text-sm sm:text-base">
                {summary.thiefHits}x
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Revive with 1 Dynamite */}
          {dynamiteCount > 0 ? (
            <button
              onClick={onRevive}
              className="w-full py-3.5 bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-white font-black rounded-2xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 text-sm transition-all active:scale-95"
            >
              <Bomb className="w-5 h-5 fill-current" />
              <span>SAVE TOM! (1 DYNAMITE LEFT: {dynamiteCount})</span>
            </button>
          ) : (
            <button
              onClick={onGoToHouse}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 text-sm transition-all active:scale-95"
            >
              <Sparkles className="w-5 h-5" />
              <span>UPGRADE TOM&apos;S HOUSE (+MULTIPLIER)</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onRestart}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Run Again</span>
            </button>
            <button
              onClick={onGoToHouse}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10"
            >
              <Home className="w-4 h-4" />
              <span>Villa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
