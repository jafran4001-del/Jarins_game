import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameState, ActivePowerUp, Mission, PlayerStats, RunSummary } from './types/game';
import { StorageService } from './services/storage';
import { INITIAL_CHARACTERS } from './data/gameData';
import { sound } from './services/sound';
import { Lobby } from './components/Lobby';
import { HUD } from './components/HUD';
import { HouseBuilder } from './components/HouseBuilder';
import { CharacterSelect } from './components/CharacterSelect';
import { VaultOpener } from './components/VaultOpener';
import { MissionsModal } from './components/MissionsModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('LOBBY');
  const [stats, setStats] = useState<PlayerStats>(() => StorageService.getStats());
  const [missions, setMissions] = useState<Mission[]>(() => StorageService.getMissions());
  const [missionsOpen, setMissionsOpen] = useState(false);

  // In-run state
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [runGold, setRunGold] = useState(0);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);

  // References
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Touch gesture state
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // Save stats whenever updated
  const handleUpdateStats = useCallback((newStats: PlayerStats) => {
    setStats(newStats);
    StorageService.saveStats(newStats);
  }, []);

  const handleUpdateMissions = useCallback((updated: Mission[]) => {
    setMissions(updated);
    StorageService.saveMissions(updated);
  }, []);

  // Update sound engine on stats change
  useEffect(() => {
    sound.setSoundEnabled(stats.soundEnabled);
    sound.setMusicEnabled(stats.musicEnabled);
  }, [stats.soundEnabled, stats.musicEnabled]);

  const toggleSound = () => {
    handleUpdateStats({
      ...stats,
      soundEnabled: !stats.soundEnabled,
    });
  };

  const toggleMusic = () => {
    handleUpdateStats({
      ...stats,
      musicEnabled: !stats.musicEnabled,
    });
  };

  // Update mission progress helper
  const advanceMission = useCallback(
    (type: Mission['type'], delta: number) => {
      setMissions(prev => {
        let changed = false;
        const updated = prev.map(m => {
          if (m.type === type && !m.completed) {
            const nextVal = m.current + delta;
            const isDone = nextVal >= m.target;
            changed = true;
            return {
              ...m,
              current: nextVal,
              completed: isDone,
            };
          }
          return m;
        });
        if (changed) {
          StorageService.saveMissions(updated);
        }
        return updated;
      });
    },
    []
  );

  // Initialize or reconfigure 3D GameEngine
  const initEngine = useCallback(() => {
    if (!canvasContainerRef.current) return;

    if (!engineRef.current) {
      engineRef.current = new GameEngine(canvasContainerRef.current, {
        onScoreUpdate: (newScore, newDist) => {
          setScore(newScore);
          setDistance(newDist);
        },
        onGoldCollect: totalG => {
          setRunGold(totalG);
          advanceMission('COLLECT_GOLD', 1);
        },
        onPowerUpChange: powers => {
          setActivePowerUps(powers);
          if (powers.length > 0) {
            advanceMission('USE_POWERUP', 1);
          }
        },
        onThiefHit: () => {
          // Hits Roy Rakoon
        },
        onJump: () => {
          advanceMission('JUMP_COUNT', 1);
        },
        onSlide: () => {
          advanceMission('SLIDE_COUNT', 1);
        },
        onGameOver: summary => {
          advanceMission('DISTANCE', summary.distance);

          // Calculate high score and bank gold
          const isNewRecord = summary.score > stats.highScore;
          const updatedHighScore = Math.max(stats.highScore, summary.score);
          const updatedGold = stats.gold + summary.gold;

          handleUpdateStats({
            ...stats,
            gold: updatedGold,
            highScore: updatedHighScore,
          });

          setRunSummary({
            ...summary,
            goldCollected: summary.gold,
            isNewHighScore: isNewRecord,
          });

          setGameState('GAMEOVER');
        },
      });
    }

    // Configure character and multipliers
    const char =
      INITIAL_CHARACTERS.find(c => c.id === stats.selectedCharacterId) || INITIAL_CHARACTERS[0];
    const multiplier = StorageService.calculateMultiplier(stats.houseUpgrades, stats.selectedCharacterId);

    engineRef.current.setCharacter(
      char.id,
      char.color,
      multiplier,
      char.magnetBonus,
      char.jetpackBonus
    );
  }, [stats, advanceMission, handleUpdateStats]);

  // Clean up engine on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  // Start run
  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setDistance(0);
    setRunGold(0);
    setActivePowerUps([]);
    setRunSummary(null);

    // Short timeout to guarantee container is mounted
    setTimeout(() => {
      initEngine();
      if (engineRef.current) {
        const char =
          INITIAL_CHARACTERS.find(c => c.id === stats.selectedCharacterId) || INITIAL_CHARACTERS[0];
        const multiplier = StorageService.calculateMultiplier(
          stats.houseUpgrades,
          stats.selectedCharacterId
        );
        engineRef.current.setCharacter(
          char.id,
          char.color,
          multiplier,
          char.magnetBonus,
          char.jetpackBonus
        );
        engineRef.current.start();
      }
      sound.startMusic();
    }, 20);
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
    }
    setGameState('PAUSED');
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resume();
    }
    setGameState('PLAYING');
  };

  const handleRevive = () => {
    if (stats.dynamite <= 0) return;

    handleUpdateStats({
      ...stats,
      dynamite: stats.dynamite - 1,
    });

    setGameState('PLAYING');
    if (engineRef.current) {
      engineRef.current.revive();
    }
  };

  const handleRestart = () => {
    setGameState('PLAYING');
    setScore(0);
    setDistance(0);
    setRunGold(0);
    setActivePowerUps([]);
    setRunSummary(null);

    if (engineRef.current) {
      engineRef.current.start();
    }
  };

  const handleGoToLobby = () => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
    setGameState('LOBBY');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING' || !engineRef.current) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        engineRef.current.moveLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        engineRef.current.moveRight();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        e.preventDefault();
        engineRef.current.jump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        engineRef.current.slide();
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handlePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Touch Swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'PLAYING') return;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (gameState !== 'PLAYING' || !touchStartPos.current || !engineRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    touchStartPos.current = null;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) < 25) return; // ignore tiny taps

    if (absX > absY) {
      if (dx > 0) {
        engineRef.current.moveRight();
      } else {
        engineRef.current.moveLeft();
      }
    } else {
      if (dy > 0) {
        engineRef.current.slide();
      } else {
        engineRef.current.jump();
      }
    }
  };

  const currentMultiplier = StorageService.calculateMultiplier(
    stats.houseUpgrades,
    stats.selectedCharacterId
  );

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas Viewport (Always present for performance, visible during PLAYING / PAUSED / GAMEOVER) */}
      <div
        ref={canvasContainerRef}
        className={`absolute inset-0 w-full h-full ${
          gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAMEOVER'
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Screen 1: Lobby */}
      {gameState === 'LOBBY' && (
        <Lobby
          stats={stats}
          missions={missions}
          onPlay={startGame}
          onOpenHouse={() => setGameState('HOUSE')}
          onOpenCharacters={() => setGameState('CHARACTERS')}
          onOpenVaults={() => setGameState('VAULTS')}
          onOpenMissions={() => setMissionsOpen(true)}
          onToggleSound={toggleSound}
          onToggleMusic={toggleMusic}
        />
      )}

      {/* Screen 2: In-Game HUD */}
      {gameState === 'PLAYING' && (
        <HUD
          score={score}
          distance={distance}
          gold={runGold}
          multiplier={currentMultiplier}
          activePowerUps={activePowerUps}
          onPause={handlePause}
          onMoveLeft={() => engineRef.current?.moveLeft()}
          onMoveRight={() => engineRef.current?.moveRight()}
          onJump={() => engineRef.current?.jump()}
          onSlide={() => engineRef.current?.slide()}
        />
      )}

      {/* Screen 3: Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          soundEnabled={stats.soundEnabled}
          musicEnabled={stats.musicEnabled}
          onResume={handleResume}
          onRestart={handleRestart}
          onGoToLobby={handleGoToLobby}
          onToggleSound={toggleSound}
          onToggleMusic={toggleMusic}
        />
      )}

      {/* Screen 4: Game Over Modal */}
      {gameState === 'GAMEOVER' && runSummary && (
        <GameOverModal
          summary={runSummary}
          highScore={stats.highScore}
          dynamiteCount={stats.dynamite}
          onRevive={handleRevive}
          onRestart={handleRestart}
          onGoToHouse={() => setGameState('HOUSE')}
        />
      )}

      {/* Screen 5: Tom's Dream House Renovation */}
      {gameState === 'HOUSE' && (
        <HouseBuilder
          stats={stats}
          onUpdateStats={handleUpdateStats}
          onPlay={startGame}
          onBack={() => setGameState('LOBBY')}
        />
      )}

      {/* Screen 6: Characters Closet */}
      {gameState === 'CHARACTERS' && (
        <CharacterSelect
          stats={stats}
          onUpdateStats={handleUpdateStats}
          onPlay={startGame}
          onBack={() => setGameState('LOBBY')}
        />
      )}

      {/* Screen 7: Secret Vaults */}
      {gameState === 'VAULTS' && (
        <VaultOpener
          stats={stats}
          onUpdateStats={handleUpdateStats}
          onPlay={startGame}
          onBack={() => setGameState('LOBBY')}
        />
      )}

      {/* Daily Missions Modal */}
      {missionsOpen && (
        <MissionsModal
          missions={missions}
          stats={stats}
          onUpdateMissions={handleUpdateMissions}
          onUpdateStats={handleUpdateStats}
          onClose={() => setMissionsOpen(false)}
        />
      )}
    </div>
  );
}
