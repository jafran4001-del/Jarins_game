import React from 'react';
import { Character, PlayerStats } from '../types/game';
import { INITIAL_CHARACTERS } from '../data/gameData';
import { sound } from '../services/sound';
import confetti from 'canvas-confetti';
import { ArrowLeft, Play, Check, Lock, Zap, Magnet, Rocket } from 'lucide-react';

interface CharacterSelectProps {
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onPlay: () => void;
  onBack: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  stats,
  onUpdateStats,
  onPlay,
  onBack,
}) => {
  const handleSelect = (character: Character) => {
    onUpdateStats({
      ...stats,
      selectedCharacterId: character.id,
    });
    sound.playPowerUp();
  };

  const handleUnlock = (character: Character) => {
    if (stats.gold < character.cost) {
      sound.playCrash();
      return;
    }

    const updatedGold = stats.gold - character.cost;
    const updatedUnlocked = [...stats.unlockedCharacters, character.id];

    onUpdateStats({
      ...stats,
      gold: updatedGold,
      unlockedCharacters: updatedUnlocked,
      selectedCharacterId: character.id,
    });

    sound.playFanfare();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
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

        <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-wide font-sans">
          Character Roster
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

      {/* Main Content */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <p className="text-sm text-slate-400 text-center max-w-lg mx-auto">
          Choose your runner! Each character possesses unique abilities and power-up extensions to help catch Roy Rakoon.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {INITIAL_CHARACTERS.map(char => {
            const isUnlocked = stats.unlockedCharacters.includes(char.id);
            const isSelected = stats.selectedCharacterId === char.id;
            const canAfford = stats.gold >= char.cost;

            return (
              <div
                key={char.id}
                className={`rounded-3xl p-5 border flex flex-col justify-between transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-400 shadow-xl shadow-amber-500/10'
                    : isUnlocked
                    ? 'bg-slate-900/80 border-white/10 hover:border-white/20'
                    : 'bg-slate-900/40 border-white/5 opacity-80'
                }`}
              >
                {/* Active Selection Badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 text-[10px] uppercase font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>SELECTED</span>
                  </div>
                )}

                <div>
                  {/* Portrait Avatar */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-800 border border-white/10 mb-4 shadow-inner">
                    <img
                      src={char.avatar}
                      alt={char.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
                        <Lock className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Character Info */}
                  <h3 className="text-lg font-black text-white">{char.name}</h3>
                  <p className="text-xs text-amber-400 font-medium mb-3">{char.title}</p>

                  {/* Perk Card */}
                  <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3 text-xs space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                      Special Trait
                    </span>
                    <p className="text-slate-200 leading-snug">{char.perk}</p>

                    <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      {char.magnetBonus > 0 && (
                        <span className="flex items-center gap-1 text-red-400">
                          <Magnet className="w-3 h-3" /> +{char.magnetBonus}s
                        </span>
                      )}
                      {char.jetpackBonus > 0 && (
                        <span className="flex items-center gap-1 text-purple-400">
                          <Rocket className="w-3 h-3" /> +{char.jetpackBonus}s
                        </span>
                      )}
                      {char.multiplierBonus > 1 && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <Zap className="w-3 h-3" /> {char.multiplierBonus}x
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-5 pt-3 border-t border-white/5">
                  {isUnlocked ? (
                    <button
                      onClick={() => handleSelect(char)}
                      disabled={isSelected}
                      className={`w-full py-2.5 rounded-xl text-xs font-black transition-all ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 cursor-default'
                          : 'bg-white/10 hover:bg-white/20 active:scale-95 text-white'
                      }`}
                    >
                      {isSelected ? 'CURRENT RUNNER' : 'SELECT RUNNER'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnlock(char)}
                      disabled={!canAfford}
                      className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>UNLOCK · {char.cost.toLocaleString()} GOLD</span>
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
