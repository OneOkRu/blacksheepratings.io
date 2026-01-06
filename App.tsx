
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

// Импортируем начальные данные из TS файла для лучшей совместимости с ESM
import { initialData } from './data';

const currentSeason = getCurrentSeason();
const currentKey = getSeasonKey(currentSeason);

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('blacksheep_players');
    if (saved !== null) return JSON.parse(saved);
    return initialData.players || [];
  });
  
  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem('blacksheep_matches');
    return saved ? JSON.parse(saved) : [];
  });

  const [champs, setChamps] = useState<Championship[]>(() => {
    const saved = localStorage.getItem('blacksheep_champs');
    if (saved !== null) return JSON.parse(saved);
    return initialData.champs || [];
  });

  const [activeView, setActiveView] = useState<ViewState>('LADDER');
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
      displayName: name,
      skinName: name,
      name,
      uuid: name,
      era: PlayerEra.NONE,
      championships: [],
      lastActive: Date.now(),
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
    localStorage.setItem('blacksheep_players', JSON.stringify(newPlayers));
    localStorage.setItem('blacksheep_matches', JSON.stringify([]));
    localStorage.setItem('blacksheep_champs', JSON.stringify(newChamps));
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

  const handleAddChampionship = (seasonKey: string, name: string, w: string, s: string, t: string) => {
    setChamps(prev => [{ id: Math.random().toString(36).substr(2, 9), seasonKey, name, winnerId: w, secondId: s, thirdId: t, timestamp: Date.now() }, ...prev]);
    setPlayers(prev => prev.map(p => {
      let badges = [...p.championships];
      if (p.id === w) badges.push({ seasonKey, place: 1 });
      if (p.id === s) badges.push({ seasonKey, place: 2 });
      if (p.id === t) badges.push({ seasonKey, place: 3 });
      return { ...p, championships: badges };
    }));
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
          <div className="space-y-4">
             <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-amber-500 text-xs font-bold uppercase tracking-widest text-center">
                ⚠️ Режим редактирования активен.
             </div>
             <AdminPanel 
                players={players} champs={champs}
                onAdd={handleAddPlayer} 
                onUpdate={handleUpdatePlayer}
                onDelete={(id) => setPlayers(prev => prev.filter(p => p.id !== id))}
                onAddChamp={handleAddChampionship}
                currentSeasonKey={currentKey}
                onClose={() => setIsAdminMode(false)}
                onFullReset={handleFullReset}
              />
          </div>
        )}

        {isLoggingMatch && <MatchLogger players={players} onRecord={handleRecordMatch} onClose={() => setIsLoggingMatch(false)} />}

        {activeView === 'EVOLUTION' && <EvolutionView players={players} category={activeCategory} />}

        {(activeView === 'LADDER' || activeView === 'RANKING') && (
          <div className="space-y-8">
            <div className="flex flex-wrap md:flex-nowrap md:items-center justify-between gap-2 md:gap-4 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 backdrop-blur-sm">
              {(Object.values(PvPCategory) as PvPCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-1 px-4 py-3 rounded-lg text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-200 ${
                    activeCategory === cat ? 'bg-zinc-100 text-zinc-900 shadow-xl' : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <Leaderboard 
              players={players} 
              category={activeCategory} 
              selectedSeason={selectedSeason} 
              onSeasonChange={setSelectedSeason}
              isExpert={activeView === 'RANKING'}
            />
          </div>
        )}

        {activeView === 'HISTORY' && <MatchHistory matches={matches} players={players} />}
        {activeView === 'CHAMPS' && <Championships champs={champs} players={players} />}
      </div>
    </Layout>
  );
};

export default App;
