import React from 'react';
import { ActivePowerUp } from '../types/game';
import { Pause, Zap, Magnet, Shield, Award, Rocket, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface HUDProps {
  score: number;
  distance: number;
  gold: number;
  multiplier: number;
  activePowerUps: ActivePowerUp[];
  onPause: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onSlide: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  distance,
  gold,
  multiplier,
  activePowerUps,
  onPause,
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
}) => {
  const getPowerUpIcon = (type: string) => {
    switch (type) {
      case 'MAGNET':
        return <Magnet className="w-5 h-5 text-red-500" />;
      case 'HELMET':
        return <Shield className="w-5 h-5 text-cyan-400" />;
      case 'MULTIPLIER':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'JETPACK':
        return <Rocket className="w-5 h-5 text-purple-400" />;
      case 'SNEAKERS':
        return <Award className="w-5 h-5 text-pink-400" />;
      default:
        return <Zap className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 select-none z-10">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between w-full max-w-4xl mx-auto pointer-events-auto">
        {/* Score & Multiplier */}
        <div className="flex flex-col gap-1">
          <div className="bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 shadow-lg flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Score</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums tracking-wide">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 font-mono">
              <Zap className="w-3.5 h-3.5 fill-current" />
              {multiplier}x MULTIPLIER
            </span>
            <span className="bg-slate-900/70 text-slate-200 px-2.5 py-0.5 rounded-full backdrop-blur-sm border border-white/10 font-mono">
              {distance}m
            </span>
          </div>
        </div>

        {/* Gold Counter & Pause */}
        <div className="flex items-center gap-3">
          {/* Gold Bar Counter */}
          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold rounded-2xl px-4 py-2 shadow-lg flex items-center gap-2 border-2 border-yellow-200">
            <div className="w-6 h-4 bg-yellow-300 border border-yellow-600 rounded-sm shadow-inner flex items-center justify-center text-[9px] font-black text-amber-900">
              GOLD
            </div>
            <span className="text-xl sm:text-2xl font-mono tabular-nums leading-none tracking-tight">
              {gold.toLocaleString()}
            </span>
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="w-12 h-12 bg-slate-900/80 hover:bg-slate-800 text-white rounded-2xl border border-white/20 shadow-lg flex items-center justify-center transition-transform active:scale-95"
            aria-label="Pause game"
          >
            <Pause className="w-6 h-6 fill-current" />
          </button>
        </div>
      </div>

      {/* Active Power-up Timers Tray */}
      {activePowerUps.length > 0 && (
        <div className="self-center flex flex-wrap gap-2.5 max-w-md pointer-events-auto">
          {activePowerUps.map(p => {
            const pct = Math.max(0, Math.min(100, (p.remaining / p.duration) * 100));
            return (
              <div
                key={p.type}
                className="bg-slate-900/85 backdrop-blur-md border border-white/20 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-lg"
              >
                {getPowerUpIcon(p.type)}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-300 uppercase leading-tight tracking-wider">
                    {p.type}
                  </span>
                  <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-100"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* On-Screen Touch Controls (Mobile Friendly / Keyboard Alternative) */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between pb-2 pointer-events-auto">
        {/* Left / Right Lane Switches */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMoveLeft}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 hover:bg-white/30 active:bg-white/40 active:scale-95 text-white backdrop-blur-md border border-white/30 rounded-2xl shadow-xl flex items-center justify-center transition-all"
            aria-label="Move Left"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <button
            onClick={onMoveRight}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 hover:bg-white/30 active:bg-white/40 active:scale-95 text-white backdrop-blur-md border border-white/30 rounded-2xl shadow-xl flex items-center justify-center transition-all"
            aria-label="Move Right"
          >
            <ArrowRight className="w-7 h-7" />
          </button>
        </div>

        {/* Center Keyboard Hint */}
        <div className="hidden md:flex flex-col items-center bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-1 text-slate-300 text-[11px] font-medium">
          <span>Arrows or WASD</span>
          <span className="text-slate-400 text-[9px]">Space to Jump</span>
        </div>

        {/* Jump & Slide Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSlide}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-500/80 hover:bg-amber-500 active:bg-amber-600 active:scale-95 text-slate-950 font-bold backdrop-blur-md border border-amber-300/40 rounded-2xl shadow-xl flex flex-col items-center justify-center transition-all"
            aria-label="Slide Roll"
          >
            <ArrowDown className="w-6 h-6" />
            <span className="text-[9px] uppercase tracking-wider font-extrabold">SLIDE</span>
          </button>
          <button
            onClick={onJump}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/85 hover:bg-emerald-500 active:bg-emerald-600 active:scale-95 text-white font-bold backdrop-blur-md border border-emerald-300/40 rounded-2xl shadow-xl flex flex-col items-center justify-center transition-all"
            aria-label="Jump"
          >
            <ArrowUp className="w-6 h-6" />
            <span className="text-[9px] uppercase tracking-wider font-extrabold">JUMP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
