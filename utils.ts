
import { SeasonType, Season } from './types';

export const calculateEloChange = (ratingA: number, ratingB: number, scoreA: number) => {
  const K = 32;
  const expectedScoreA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  return Math.round(K * (scoreA - expectedScoreA));
};

export const getTier = (elo: number): string => {
  if (elo >= 2200) return 'S';
  if (elo >= 1900) return 'A';
  if (elo >= 1600) return 'B';
  if (elo >= 1300) return 'C';
  return 'D';
};

export const getTierColor = (tier: string): string => {
  switch (tier) {
    case 'S': return 'text-yellow-400';
    case 'A': return 'text-purple-400';
    case 'B': return 'text-blue-400';
    case 'C': return 'text-green-400';
    case 'D': return 'text-gray-400';
    default: return 'text-white';
  }
};

export const getAvatarUrl = (name: string) => {
  return `https://mc-heads.net/avatar/${name}/64`;
};

export const getCurrentSeason = (): Season => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  
  let type: SeasonType;
  if (month >= 2 && month <= 4) type = SeasonType.SPRING;
  else if (month >= 5 && month <= 7) type = SeasonType.SUMMER;
  else if (month >= 8 && month <= 10) type = SeasonType.AUTUMN;
  else type = SeasonType.WINTER;
  
  return { year, type };
};

export const getSeasonKey = (season: Season) => `${season.year}-${season.type}`;

export const getSeasonIcon = (type: SeasonType) => {
  switch (type) {
    case SeasonType.WINTER: return '❄️';
    case SeasonType.SPRING: return '🌸';
    case SeasonType.SUMMER: return '☀️';
    case SeasonType.AUTUMN: return '🍂';
  }
};
