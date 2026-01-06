import React, { useState } from 'react';
import { PvPCategory, Player, PlayerEra, Season, SeasonType, ChampBadge } from '../types';
import { getTierColor, getAvatarUrl, getSeasonKey, getSeasonIcon } from '../utils';
import { Trophy, Search, MapPin, Sparkles, Star, Calendar, History, Zap, Clock, Globe } from 'lucide-react';

interface LeaderboardProps {
  players: Player[];
  category: PvPCategory;
  selectedSeason: Season;
  onSeasonChange: (season: Season) => void;
  isExpert?: boolean; // Соответствует режиму RANKING
}

const SchoolPlaque = ({ era }: { era: PlayerEra }) => {
  let color = "bg-zinc-800 text-zinc-500";
  if (era === PlayerEra.OLD_SCHOOL) color = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
  else if (era === PlayerEra.NEW_SCHOOL) color = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
  else if (era === PlayerEra.NEWEST_SCHOOL) color = "bg-rose-500/10 text-rose-500 border border-rose-500/20";

  return (
    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${color}`}>
      {era}
    </span>
  );
};

const ChampionshipBadge: React.FC<{ badge: ChampBadge }> = ({ badge }) => {
  const seasonParts = badge.seasonKey.split('-');
  const yearShort = seasonParts[0].slice(-2);
  const typeChar = seasonParts[1][0]; 
  const color = badge.place === 1 ? 'text-yellow-500 border-yellow-500/30' : badge.place === 2 ? 'text-zinc-300 border-zinc-500/30' : 'text-amber-700 border-amber-700/30';
  
  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 border ${color} shadow-sm backdrop-blur-sm`}>
      <Trophy className="w-2.5 h-2.5" />
      <span className="text-[8px] font-black tracking-tighter">{typeChar}{yearShort}</span>
    </div>
  );
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ players, category, selectedSeason, onSeasonChange, isExpert }) => {
  const [search, setSearch] = useState('');
  const isOverall = category === PvPCategory.OVERALL;
  const sKey = getSeasonKey(selectedSeason);

  // Сортировка: в Ranking (isExpert = true) сначала по manualRank, затем по ELO
  const sortedPlayers = [...players].filter(p => !!p.stats[sKey]).sort((a, b) => {
    const sA = a.stats[sKey]?.[category];
    const sB = b.stats[sKey]?.[category];
    
    if (isExpert) {
      if (sA?.manualRank !== undefined || sB?.manualRank !== undefined) {
        const rankA = sA?.manualRank ?? 9999;
        const rankB = sB?.manualRank ?? 9999;
        if (rankA !== rankB) return rankA - rankB;
      }
    }
    
    const valA = sA?.elo ?? 0;
    const valB = sB?.elo ?? 0;
    return valB - valA;
  }).filter(p => p.displayName.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase()));

  const navigateSeason = (dir: number) => {
    const types = Object.values(SeasonType);
    const currIdx = types.indexOf(selectedSeason.type);
    let nextIdx = (currIdx + dir + 4) % 4;
    let nextYear = selectedSeason.year + (dir === 1 && currIdx === 3 ? 1 : dir === -1 && currIdx === 0 ? -1 : 0);
    onSeasonChange({ year: nextYear, type: types[nextIdx] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 px-6 gap-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-red-500" />
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block">Season Archive</span>
            <span className="text-white font-black italic tracking-tight text-lg flex items-center gap-2 uppercase">
              {getSeasonIcon(selectedSeason.type)} {selectedSeason.type} {selectedSeason.year}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigateSeason(-1)} className="p-2 px-6 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all font-black text-[10px] uppercase border border-zinc-700">Prev</button>
          <button onClick={() => navigateSeason(1)} className="p-2 px-6 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all font-black text-[10px] uppercase border border-zinc-700">Next</button>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Lookup fighter database..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-5 pl-12 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-red-600/50 transition-all font-bold tracking-tight"
        />
      </div>

      <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 overflow-hidden backdrop-blur-sm shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[850px]">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/20">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-center">Rank</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Warrior</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-center">{isOverall ? 'Main Tier' : 'Tier'}</th>
                {isOverall && <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-center">Sub-Tiers</th>}
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Rating</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right pr-12">Legacy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {sortedPlayers.map((player, idx) => {
                const pStats = player.stats[sKey] || {};
                const currentStats = pStats[category];
                const hasMatches = (currentStats?.wins || 0) + (currentStats?.losses || 0) > 0;
                
                const displayRank = isExpert ? (currentStats?.manualRank ?? idx + 1) : (idx + 1);

                return (
                  <tr key={player.id} className="group hover:bg-zinc-100/5 transition-all duration-300">
                    <td className="px-6 py-6 text-center">
                       <span className={`text-xl font-black italic tracking-tighter ${idx < 3 ? 'text-white' : 'text-zinc-600'}`}>
                         #{displayRank}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {/* ИСПРАВЛЕНИЕ ТУТ: Добавлены классы flex-shrink-0 aspect-square object-cover */}
                          <img 
                            src={getAvatarUrl(player.skinName || player.name)} 
                            className="w-14 h-14 rounded-2xl shadow-xl border border-white/5 flex-shrink-0 aspect-square object-cover" 
                            alt="" 
                          />
                          <div className="absolute -bottom-1 -right-1 bg-zinc-900 rounded-full p-1 border border-zinc-800">
                             <div className={`w-2 h-2 rounded-full ${Date.now() - player.lastActive < 3600000 ? 'bg-green-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xl text-white tracking-tight">{player.displayName}</span>
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                              {player.championships?.map((b, i) => <ChampionshipBadge key={i} badge={b} />)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <SchoolPlaque era={player.era} />
                             {player.customRank && <span className="text-red-500 flex items-center gap-1 text-[9px] font-black uppercase"><Sparkles className="w-3 h-3" />{player.customRank}</span>}
                             {player.location && <span className="flex items-center gap-1 text-[9px] font-bold text-zinc-500 uppercase"><MapPin className="w-3 h-3" />{player.location}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-center">
                        <span className={`text-4xl font-black italic tracking-tighter drop-shadow-lg ${getTierColor(currentStats?.tier || 'D')}`}>
                          {currentStats?.tier || 'D'}
                        </span>
                      </div>
                    </td>
                    {isOverall && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-4">
                          {[PvPCategory.AXE_SHIELD, PvPCategory.DIAMOND, PvPCategory.NETHERITE].map(cat => {
                            const t = pStats[cat]?.tier || 'D';
                            const initial = cat === PvPCategory.AXE_SHIELD ? 'AXE' : cat === PvPCategory.DIAMOND ? 'DIA' : 'NET';
                            return (
                              <div key={cat} className="flex flex-col items-center group/tier">
                                <span className={`text-[12px] font-black italic group-hover/tier:scale-125 transition-transform ${getTierColor(t)}`}>{t}</span>
                                <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-tighter">{initial}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black font-mono tracking-tighter text-zinc-100 group-hover:text-red-500 transition-colors">
                          {hasMatches ? (currentStats?.elo || 1200) : '?'}
                        </span>
                        <div className="flex items-center gap-2">
                           <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">ELO UNIT</span>
                           <span className="text-[8px] text-green-500 font-bold">+{currentStats?.wins || 0}W</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right pr-12">
                       <div className="flex flex-col items-end">
                        <span className="font-black text-zinc-300 text-lg italic flex items-center gap-2 uppercase tracking-tighter">
                          <Star className="w-4 h-4 text-red-600 fill-red-600/20" />
                          {player.primeTime || 'TBD'}
                        </span>
                        <span className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.2em]">Peak Period</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
