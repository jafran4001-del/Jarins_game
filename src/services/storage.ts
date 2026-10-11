import { Mission, PlayerStats } from '../types/game';
import { INITIAL_CHARACTERS, INITIAL_MISSIONS } from '../data/gameData';

const STORAGE_KEY = 'tom_gold_run_save_v1';
const MISSIONS_KEY = 'tom_gold_run_missions_v1';

const DEFAULT_STATS: PlayerStats = {
  gold: 350, // Starting gold so player can try first upgrade!
  diamonds: 10,
  dynamite: 2,
  highScore: 0,
  selectedCharacterId: 'tom',
  houseUpgrades: {
    foundation: 0,
    ground_floor: 0,
    bedroom: 0,
    roof: 0,
    swimming_pool: 0,
    garden: 0,
  },
  unlockedCharacters: ['tom'],
  soundEnabled: true,
  musicEnabled: true,
};

export class StorageService {
  public static getStats(): PlayerStats {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return DEFAULT_STATS;
      return { ...DEFAULT_STATS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_STATS;
    }
  }

  public static saveStats(stats: PlayerStats) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }

  public static getMissions(): Mission[] {
    try {
      const data = localStorage.getItem(MISSIONS_KEY);
      if (!data) return INITIAL_MISSIONS;
      const parsed = JSON.parse(data);
      // Ensure all initial missions exist
      return INITIAL_MISSIONS.map(m => {
        const found = parsed.find((p: Mission) => p.id === m.id);
        return found ? { ...m, ...found } : m;
      });
    } catch {
      return INITIAL_MISSIONS;
    }
  }

  public static saveMissions(missions: Mission[]) {
    try {
      localStorage.setItem(MISSIONS_KEY, JSON.stringify(missions));
    } catch (e) {
      console.warn('Missions save failed', e);
    }
  }

  public static calculateMultiplier(houseUpgrades: Record<string, number>, characterId: string): number {
    let houseBonus = 1;
    Object.values(houseUpgrades).forEach(lvl => {
      houseBonus += lvl;
    });

    const char = INITIAL_CHARACTERS.find(c => c.id === characterId);
    const charBonus = char ? char.multiplierBonus : 1;

    return houseBonus * charBonus;
  }
}
