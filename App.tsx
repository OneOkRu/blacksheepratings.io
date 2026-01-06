import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Leaderboard } from './components/Leaderboard';
import { AdminPanel } from './components/AdminPanel';
import { MatchLogger } from './components/MatchLogger';
import { Championships } from './components/Championships';
import { MatchHistory } from './components/MatchHistory';
import { EvolutionView } from './components/EvolutionView';
import { PvPCategory, Player, Match, PlayerEra, Season, Championship, BattleType, ViewState, PlayerStats } from './types';
import { calculateEloChange, getTier, getCurrentSeason, getSeasonKey } from './utils';

import jsonData from './data.json';

const currentSeason = getCurrentSeason();
const currentKey = getSeasonKey(currentSeason);

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem('blacksheep_players');
      if (!saved || saved === '[]') return (jsonData.players as Player[]) || [];
      return JSON.parse(saved);
    } catch (e) { return (jsonData.players as Player[]) || []; }
  });
  
  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const saved = localStorage.getItem('blacksheep_matches');
      return (saved && saved !== '[]') ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [champs, setChamps] = useState<Championship[]>(() => {
    try {
      const saved = localStorage.getItem('blacksheep_champs');
      if (!saved || saved === '[]') return (jsonData.champs as Championship[]) || [];
      return JSON.parse(saved);
    } catch (e) { return (jsonData.champs as Championship[]) || []; }
  });

  const [activeView, setActiveView] = useState<ViewState>('RANKING');
  const [activeCategory, setActiveCategory] = useState<PvPCategory>(PvPCategory.OVERALL);
  const [selectedSeason, setSelectedSeason] = useState<Season>(currentSeason);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoggingMatch, setIsLoggingMatch] = useState(false);

  useEffect(() => {
    localStorage.setItem('blacksheep_players', JSON.stringify(players));
    localStorage.setItem('blacksheep_matches', JSON.stringify(matches));
    localStorage.setItem('blacksheep_champs', JSON.stringify(champs));
  }, [players, matches, champs]);

  const handleAddPlayer = (name: string) => {
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      displayName: name, skinName: name, name, uuid: name,
      era: PlayerEra.NONE, championships: [], lastActive: Date.now(),
      stats: { [currentKey]: {
        [PvPCategory.AXE_SHIELD]: { elo: 1200, wins: 0, losses: 0, tier: 'D' },
        [PvPCategory.DIAMOND]: { elo: 1200, wins: 0, losses: 0, tier: 'D' },
        [PvPCategory.NETHERITE]: { elo: 1200, wins: 0, losses: 0, tier: 'D' },
        [PvPCategory.OVERALL]: { elo: 1200, wins: 0, losses: 0, tier: 'D' },
      }}
    };
    setPlayers(prev => [...prev, newPlayer]);
  };

  const handleUpdatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleFullReset = (newPlayers: Player[], newChamps: Championship[]) => {
    setPlayers(newPlayers);
    setChamps(newChamps);
    setMatches([]);
  };

  // ФУНКЦИЯ УДАЛЕНИЯ ТУРНИРА
  const handleDeleteChampionship = (champId: string) => {
    const champToDelete = champs.find(c => c.id === champId);
    if (!champToDelete) return;

    // 1. Удаляем из списка турниров
    setChamps(prev => prev.filter(c => c.id !== champId));

    // 2. Удаляем бейджи у игроков, которые были выданы за этот конкретный сезон
    setPlayers(prev => prev.map(p => ({
      ...p,
      championships: p.championships.filter(badge => 
        !(badge.seasonKey === champToDelete.seasonKey && 
         (p.id === champToDelete.winnerId || p.id === champToDelete.secondId || p.id === champToDelete.thirdId))
      )
    })));
  };

  const handleAddChampionship = (seasonKey: string, name: string, w: string, s: string, t: string) => {
    // Если мы редактируем (ID уже существует), сначала удалим старую версию
    const existing = champs.find(c => c.name === name && c.seasonKey === seasonKey);
    if (existing) handleDeleteChampionship(existing.id);

    const newId = Math.random().toString(36).substr(2, 9);
    setChamps(prev => [{ id: newId, seasonKey, name, winnerId: w, secondId: s, thirdId: t, timestamp: Date.now() }, ...prev]);
    
    setPlayers(prev => prev.map(p => {
      let badges = [...(p.championships || [])];
      if (p.id === w) badges.push({ seasonKey, place: 1 });
      if (p.id === s) badges.push({ seasonKey, place: 2 });
      if (p.id === t) badges.push({ seasonKey, place: 3 });
      return { ...p, championships: badges };
    }));
  };

  const handleRecordMatch = (winnerId: string, participantIds: string[], type: BattleType, category: Exclude<PvPCategory, PvPCategory.OVERALL>, location?: string) => {
    setPlayers(prevPlayers => {
        const winner = prevPlayers.find(p => p.id === winnerId);
        if (!winner) return prevPlayers;
        
        let matchEloGain = 0;
        const loserIds = participantIds.filter(id => id !== winnerId);
  
        const defaultSeasonStats: Record<PvPCategory, PlayerStats> = {
          [PvPCategory.AXE_SHIELD]: { elo: 1200, wins: 0, losses: 0, tier: 'D' },
          [PvPCategory.DIAMOND]: { elo: 1200, wins: 0, losses: 0, tier: 'D' },
          [PvPCategory.NETHERITE]: { elo: 1200, wins: 0, losses: 0, tier: 'D' },
          [PvPCategory.OVERALL]: { elo: 1200, wins: 0, losses: 0, tier: 'D' },
        };
  
        const newPlayerStates = prevPlayers.map((p): Player => {
          const pSeasonStats = p.stats[currentKey] || { ...defaultSeasonStats };
          const s = pSeasonStats[category];
          
          if (p.id === winnerId) {
            let calculatedGain = 0;
            loserIds.forEach(lId => {
              const loser = prevPlayers.find(pl => pl.id === lId);
              const lStats = loser?.stats[currentKey]?.[category] || { elo: 1200 };
              calculatedGain += calculateEloChange(s.elo, lStats.elo, 1);
            });
            
            matchEloGain = calculatedGain;
            const newElo = s.elo + calculatedGain;
            
            const updatedSeason: Record<PvPCategory, PlayerStats> = { 
              ...pSeasonStats, 
              [category]: { ...s, elo: newElo, wins: s.wins + 1, tier: getTier(newElo) } 
            };
            
            return { 
              ...p, 
              lastActive: Date.now(), 
              stats: { ...p.stats, [currentKey]: updatedSeason } 
            };
          } else if (loserIds.includes(p.id)) {
            const winnerSeasonStats = winner.stats[currentKey] || { ...defaultSeasonStats };
            const winnerStats = winnerSeasonStats[category];
            const gain = calculateEloChange(winnerStats.elo, s.elo, 1);
            const newElo = Math.max(800, s.elo - gain);
            
            const updatedSeason: Record<PvPCategory, PlayerStats> = { 
              ...pSeasonStats, 
              [category]: { ...s, elo: newElo, losses: s.losses + 1, tier: getTier(newElo) } 
            };
            
            return { 
              ...p, 
              lastActive: Date.now(), 
              stats: { ...p.stats, [currentKey]: updatedSeason } 
            };
          }
          return p;
        });
  
        setMatches(prev => [{ 
          id: Math.random().toString(36).substr(2, 9), 
          winnerId, 
          participantIds, 
          battleType: type, 
          category, 
          eloGain: matchEloGain, 
          timestamp: Date.now(), 
          location, 
          seasonKey: currentKey 
        }, ...prev]);
  
        return newPlayerStates;
      });
      setIsLoggingMatch(false);
  };

  return (
    <Layout 
      onAdminToggle={() => setIsAdminMode(!isAdminMode)} 
      isAdminActive={isAdminMode}
      onLogToggle={() => setIsLoggingMatch(!isLoggingMatch)}
      isLogActive={isLoggingMatch}
      activeView={activeView}
      onViewChange={setActiveView}
    >
      <div className="space-y-12">
        {isAdminMode && (
          <AdminPanel 
            players={players} champs={champs}
            onAdd={handleAddPlayer} 
            onUpdate={handleUpdatePlayer}
            onDelete={(id) => setPlayers(prev => prev.filter(p => p.id !== id))}
            onAddChamp={handleAddChampionship}
            onDeleteChamp={handleDeleteChampionship} // Передаем удаление
            currentSeasonKey={currentKey}
            onClose={() => setIsAdminMode(false)}
            onFullReset={handleFullReset}
          />
        )}
        {isLoggingMatch && <MatchLogger players={players} onRecord={handleRecordMatch} onClose={() => setIsLoggingMatch(false)} />}
        {activeView === 'EVOLUTION' && <EvolutionView players={players} category={activeCategory} />}
        {activeView === 'RANKING' && (
          <div className="space-y-8">
            <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 backdrop-blur-sm">
              {(Object.values(PvPCategory) as PvPCategory[]).map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeCategory === cat ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500'}`}>{cat}</button>
              ))}
            </div>
            <Leaderboard players={players} category={activeCategory} selectedSeason={selectedSeason} onSeasonChange={setSelectedSeason} isExpert={true} />
          </div>
        )}
        {activeView === 'HISTORY' && <MatchHistory matches={matches} players={players} />}
        {activeView === 'CHAMPS' && <Championships champs={champs} players={players} />}
      </div>
    </Layout>
  );
};

export default App;
