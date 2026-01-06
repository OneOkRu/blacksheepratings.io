
export enum PvPCategory {
  AXE_SHIELD = 'Axe & Shield',
  DIAMOND = 'Diamond PvP',
  NETHERITE = 'Netherite PvP',
  OVERALL = 'Overall'
}

export enum PlayerEra {
  OLD_SCHOOL = 'Старая школа',
  NEW_SCHOOL = 'Новая школа',
  NEWEST_SCHOOL = 'Новейшая школа',
  NONE = 'N/A'
}

export enum SeasonType {
  WINTER = 'Winter',
  SPRING = 'Spring',
  SUMMER = 'Summer',
  AUTUMN = 'Autumn'
}

export enum BattleType {
  DUEL = 'Duel (1v1)',
  FFA = 'Free For All (FFA)'
}

export interface Season {
  year: number;
  type: SeasonType;
}

export interface PlayerStats {
  elo: number;
  wins: number;
  losses: number;
  tier: string;
  manualRank?: number; 
}

export interface ChampBadge {
  seasonKey: string;
  place: 1 | 2 | 3;
}

export interface Player {
  id: string;
  displayName: string;
  skinName: string;
  name: string; 
  uuid: string;
  era: PlayerEra;
  customRank?: string;
  location?: string;
  primeTime?: string;
  stats: Record<string, Record<PvPCategory, PlayerStats>>;
  championships: ChampBadge[];
  lastActive: number;
}

export interface Championship {
  id: string;
  seasonKey: string;
  name: string;
  winnerId: string;
  secondId: string;
  thirdId: string;
  timestamp: number;
}

export interface Match {
  id: string;
  winnerId: string;
  participantIds: string[];
  battleType: BattleType;
  category: Exclude<PvPCategory, PvPCategory.OVERALL>;
  eloGain: number;
  timestamp: number;
  location?: string;
  seasonKey: string;
}

export type ViewState = 'LADDER' | 'RANKING' | 'HISTORY' | 'CHAMPS' | 'EVOLUTION';
