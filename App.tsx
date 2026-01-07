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
  // ТЕПЕРЬ ДАННЫЕ ВСЕГДА ЗАГРУЖАЮТСЯ ИЗ JSON ПРИ ПЕРЕЗАГРУЗКЕ
  const [players, setPlayers] = useState<Player[]>(jsonData.players as Player[]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [champs, setChamps] = useState<Championship[]>(jsonData.champs as Championship[]);

  const [activeView, setActiveView] = useState<ViewState>('RANKING');
  const [activeCategory, setActiveCategory] = useState<PvPCategory>(PvPCategory.OVERALL);
  const [selectedSeason, setSelectedSeason] = useState<Season>(currentSeason);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoggingMatch, setIsLoggingMatch] = useState(false);

  // Сохраняем в память только для того, чтобы данные не пропадали ПРИ ПЕРЕКЛЮЧЕНИИ ВКЛАДОК.
  // Но при F5 они сбросятся, так как мы убрали getItem выше.
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

  // --- ИСПРАВЛЕННАЯ ФУНКЦИЯ ТОЧЕЧНОГО УДАЛЕНИЯ КУБКА ---
  const handleDeleteChampionship = (champId: string) => {
    const champToDelete = champs.find(c => c.id === champId);
    if (!champToDelete) return;

    setChamps(prev => prev.filter(c => c.id !== champId));

    setPlayers(prev => prev.map(p => {
      let placeToRemove = 0;
      if (p.id === champToDelete.winnerId) placeToRemove = 1;
      else if (p.id === champToDelete.secondId) placeToRemove = 2;
      else if (p.id === champToDelete.thirdId) placeToRemove = 3;

      if (placeToRemove === 0) return p;

      // Ищем индекс конкретной медали этого турнира
      const bIdx = p.championships.findIndex(b => 
        b.seasonKey === champToDelete.seasonKey && b.place === placeToRemove
      );

      if (bIdx !== -1) {
        const newBadges = [...p.championships];
        newBadges.splice(bIdx, 1); // Удаляем только одну найденную медаль
        return { ...p, championships: newBadges };
      }
      return p;
    }));
  };

  const handleAddChampionship = (seasonKey: string, name: string, w: string, s: string, t: string) => {
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
        const loserIds = participantIds.filter(id => id !== winnerId);
        const newPlayerStates = prevPlayers.map((p): Player => {
          const pStats = p.stats[currentKey] || { [category]: { elo: 1200, wins: 0, losses: 0, tier: 'D' } };
          const s = pStats[category] || { elo: 1200, wins: 0, losses: 0, tier: 'D' };
          if (p.id === winnerId) {
            let gain = 0;
            loserIds.forEach(lId => {
              const l = prevPlayers.find(pl => pl.id === lId);
              const ls = l?.stats[currentKey]?.[category] || { elo: 1200 };
              gain += calculateEloChange(s.elo, ls.elo, 1);
            });
            const newElo = s.elo + gain;
            return { ...p, lastActive: Date.now(), stats: { ...p.stats, [currentKey]: { ...pStats, [category]: { ...s, elo: newElo, wins: s.wins + 1, tier: getTier(newElo) } } } };
          } else if (loserIds.includes(p.id)) {
            const wElo = winner.stats[currentKey]?.[category]?.elo || 1200;
            const lossGain = calculateEloChange(wElo, s.elo, 1);
            const newElo = Math.max(800, s.elo - lossGain);
            return { ...p, lastActive: Date.now(), stats: { ...p.stats, [currentKey]: { ...pStats, [category]: { ...s, elo: newElo, losses: s.losses + 1, tier: getTier(newElo) } } } };
          }
          return p;
        });
        return newPlayerStates;
      });
      setIsLoggingMatch(false);
  };

  return (
    <Layout 
      onAdminToggle={() => setIsAdminMode(!isAdminMode)} isAdminActive={isAdminMode}
      onLogToggle={() => setIsLoggingMatch(!isLoggingMatch)} isLogActive={isLoggingMatch}
      activeView={activeView} onViewChange={setActiveView}
    >
      <div className="space-y-12">
        {isAdminMode && (
          <AdminPanel 
            players={players} champs={champs}
            onAdd={handleAddPlayer} onUpdate={handleUpdatePlayer}
            onDelete={(id) => setPlayers(prev => prev.filter(p => p.id !== id))}
            onAddChamp={handleAddChampionship}
            onDeleteChamp={handleDeleteChampionship} 
            currentSeasonKey={currentKey}
            onClose={() => setIsAdminMode(false)}
            onFullReset={handleFullReset}
          />
        )}
        {isLoggingMatch && <MatchLogger players={players} onRecord={handleRecordMatch} onClose={() => setIsLoggingMatch(false)} />}
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
        {activeView === 'EVOLUTION' && <EvolutionView players={players} category={activeCategory} />}
        {activeView === 'HISTORY' && <MatchHistory matches={matches} players={players} />}
        {activeView === 'CHAMPS' && <Championships champs={champs} players={players} />}
      </div>
    </Layout>
  );
};

export default App;
