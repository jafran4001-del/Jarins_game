import React from 'react';
import { Character, Mission, PlayerStats } from '../types/game';
import { INITIAL_CHARACTERS, HOUSE_PARTS } from '../data/gameData';
import { Play, Home, Users, Package, Gift, Trophy, Zap, Volume2, VolumeX, Music } from 'lucide-react';

interface LobbyProps {
  stats: PlayerStats;
  missions: Mission[];
  onPlay: () => void;
  onOpenHouse: () => void;
  onOpenCharacters: () => void;
  onOpenVaults: () => void;
  onOpenMissions: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  stats,
  missions,
  onPlay,
  onOpenHouse,
  onOpenCharacters,
  onOpenVaults,
  onOpenMissions,
  onToggleSound,
  onToggleMusic,
}) => {
  const selectedChar =
    INITIAL_CHARACTERS.find(c => c.id === stats.selectedCharacterId) || INITIAL_CHARACTERS[0];

  // Multiplier calculation
  let houseLevelSum = 0;
  Object.values(stats.houseUpgrades).forEach(lvl => (houseLevelSum += lvl));
  const currentMultiplier = (1 + houseLevelSum) * selectedChar.multiplierBonus;

  // Check claimable missions
  const claimableCount = missions.filter(m => m.current >= m.target && !m.claimed).length;

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-slate-950 text-base shadow-md">
            G
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-none">
              TOM GOLD RUN
            </h1>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              Chase The Bandit
            </span>
          </div>
        </div>

        {/* Currency & Audio Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Gold Bar Counter */}
          <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl px-3 py-1 flex items-center gap-1.5 text-amber-300 font-bold font-mono text-xs sm:text-sm shadow-sm">
            <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded">GOLD</span>
            <span>{stats.gold.toLocaleString()}</span>
          </div>

          {/* Diamonds Counter */}
          <div className="bg-cyan-500/20 border border-cyan-400/30 rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-cyan-300 font-bold font-mono text-xs sm:text-sm">
            <span className="text-[10px] bg-cyan-400 text-slate-950 font-black px-1.5 py-0.2 rounded">GEM</span>
            <span>{stats.diamonds}</span>
          </div>

          {/* Sound & Music Mini-Toggles */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-white/10 rounded-xl p-1">
            <button
              onClick={onToggleSound}
              className={`p-1.5 rounded-lg transition-colors ${
                stats.soundEnabled ? 'text-amber-400 hover:bg-white/5' : 'text-slate-500 hover:bg-white/5'
              }`}
              title="Toggle Sound Effects"
            >
              {stats.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onToggleMusic}
              className={`p-1.5 rounded-lg transition-colors ${
                stats.musicEnabled ? 'text-amber-400 hover:bg-white/5' : 'text-slate-500 hover:bg-white/5'
              }`}
              title="Toggle Background Music"
            >
              <Music className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Character Stage */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center justify-center space-y-6">
        {/* Character Stage Card */}
        <div className="w-full max-w-xl bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center flex flex-col items-center">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

          {/* High Score Banner */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-white/10 rounded-full px-3.5 py-1 text-xs font-mono text-slate-300 mb-5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>BEST SCORE:</span>
            <span className="font-extrabold text-amber-400 tabular-nums">{stats.highScore.toLocaleString()}</span>
          </div>

          {/* Character Showcase Avatar */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-3xl overflow-hidden border-4 border-amber-400/40 shadow-2xl mb-4 group bg-slate-800">
            <img
              src={selectedChar.avatar}
              alt={selectedChar.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            {/* Multiplier Badge Over Avatar */}
            <div className="absolute bottom-2 right-2 bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md font-mono">
              <Zap className="w-3 h-3 fill-current" />
              {currentMultiplier}x BOOST
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white">{selectedChar.name}</h2>
          <p className="text-xs sm:text-sm text-amber-400/90 font-medium mt-0.5">{selectedChar.title}</p>
          <p className="text-xs text-slate-400 max-w-xs mt-1.5">{selectedChar.perk}</p>

          {/* Big Play / Start Run CTA */}
          <button
            onClick={onPlay}
            className="w-full sm:w-72 mt-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 text-lg sm:text-xl transition-all active:scale-95 group"
          >
            <Play className="w-7 h-7 fill-slate-950 transition-transform group-hover:scale-110" />
            <span>RUN & CHASE!</span>
          </button>
        </div>

        {/* Quick Hub Navigation Cards */}
        <div className="w-full max-w-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* House Renovation */}
          <button
            onClick={onOpenHouse}
            className="bg-slate-900/90 hover:bg-slate-850 active:scale-95 border border-white/10 hover:border-amber-400/40 rounded-2xl p-3.5 flex flex-col items-center text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-white">Tom&apos;s Villa</span>
            <span className="text-[10px] text-amber-400 font-mono mt-0.5">+{houseLevelSum}x Boost</span>
          </button>

          {/* Characters Closet */}
          <button
            onClick={onOpenCharacters}
            className="bg-slate-900/90 hover:bg-slate-850 active:scale-95 border border-white/10 hover:border-pink-400/40 rounded-2xl p-3.5 flex flex-col items-center text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-white">Characters</span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {stats.unlockedCharacters.length}/{INITIAL_CHARACTERS.length} Unlocked
            </span>
          </button>

          {/* Safes & Vaults */}
          <button
            onClick={onOpenVaults}
            className="bg-slate-900/90 hover:bg-slate-850 active:scale-95 border border-white/10 hover:border-cyan-400/40 rounded-2xl p-3.5 flex flex-col items-center text-center transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-white">Vaults</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Crack Safes</span>
          </button>

          {/* Missions */}
          <button
            onClick={onOpenMissions}
            className="bg-slate-900/90 hover:bg-slate-850 active:scale-95 border border-white/10 hover:border-emerald-400/40 rounded-2xl p-3.5 flex flex-col items-center text-center transition-all relative group"
          >
            {claimableCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                {claimableCount}
              </span>
            )}
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Gift className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-white">Missions</span>
            <span className="text-[10px] text-emerald-400 mt-0.5">
              {claimableCount > 0 ? `${claimableCount} Ready` : 'Quests'}
            </span>
          </button>
        </div>
      </main>

      {/* Footer Controls & Instructions */}
      <footer className="py-3 px-4 border-t border-white/5 text-center text-xs text-slate-500">
        <span>Controls: Arrow Keys / WASD · Space to Jump · S / Down to Slide · Touch / Swipe on Mobile</span>
      </footer>
    </div>
  );
};
