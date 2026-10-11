export type GameState = 'LOBBY' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'HOUSE' | 'CHARACTERS' | 'VAULTS';

export type Lane = -1 | 0 | 1; // Left, Center, Right

export type PowerUpType = 'MAGNET' | 'HELMET' | 'MULTIPLIER' | 'JETPACK' | 'SNEAKERS';

export interface ActivePowerUp {
  type: PowerUpType;
  duration: number; // total duration in ms
  remaining: number; // remaining in ms
}

export interface Character {
  id: string;
  name: string;
  title: string;
  avatar: string;
  cost: number;
  unlocked: boolean;
  color: string;
  perk: string;
  magnetBonus: number; // extra seconds
  jetpackBonus: number;
  multiplierBonus: number;
}

export interface HousePart {
  id: string;
  name: string;
  icon: string;
  description: string;
  currentLevel: number;
  maxLevel: number;
  costPerLevel: number[]; // gold cost for each level
}

export interface Mission {
  id: string;
  title: string;
  target: number;
  current: number;
  rewardGold: number;
  rewardDiamonds: number;
  completed: boolean;
  claimed: boolean;
  type: 'COLLECT_GOLD' | 'JUMP_COUNT' | 'SLIDE_COUNT' | 'USE_POWERUP' | 'DISTANCE';
}

export interface PlayerStats {
  gold: number;
  diamonds: number;
  dynamite: number;
  highScore: number;
  selectedCharacterId: string;
  houseUpgrades: Record<string, number>;
  unlockedCharacters: string[];
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export interface RunSummary {
  score: number;
  goldCollected: number;
  distance: number;
  isNewHighScore: boolean;
  thiefHits: number;
}
