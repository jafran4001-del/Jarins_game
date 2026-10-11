import React from 'react';
import { Volume2, VolumeX, Music, Play, RotateCcw, Home, X } from 'lucide-react';

interface PauseModalProps {
  soundEnabled: boolean;
  musicEnabled: boolean;
  onResume: () => void;
  onRestart: () => void;
  onGoToLobby: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  soundEnabled,
  musicEnabled,
  onResume,
  onRestart,
  onGoToLobby,
  onToggleSound,
  onToggleMusic,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h2 className="text-2xl font-black text-white">Paused</h2>
          <button
            onClick={onResume}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Toggles */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onToggleSound}
            className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
              soundEnabled
                ? 'bg-slate-800 border-amber-400/50 text-white'
                : 'bg-slate-950 border-white/5 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-6 h-6 text-amber-400" /> : <VolumeX className="w-6 h-6" />}
            <span className="text-[11px] font-bold">SFX: {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onToggleMusic}
            className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
              musicEnabled
                ? 'bg-slate-800 border-amber-400/50 text-white'
                : 'bg-slate-950 border-white/5 text-slate-500'
            }`}
          >
            <Music className={`w-6 h-6 ${musicEnabled ? 'text-amber-400' : ''}`} />
            <span className="text-[11px] font-bold">MUSIC: {musicEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="space-y-2.5">
          <button
            onClick={onResume}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>RESUME CHASE</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART RUN</span>
          </button>

          <button
            onClick={onGoToLobby}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>RETURN TO LOBBY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
