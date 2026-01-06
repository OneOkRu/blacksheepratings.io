
import React, { useState } from 'react';
import { Match, Player } from '../types';
import { History, Search, Swords, Shield, Gem, Users, MapPin, Calendar } from 'lucide-react';

interface MatchHistoryProps {
  matches: Match[];
  players: Player[];
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ matches, players }) => {
  const [search, setSearch] = useState('');

  const filteredMatches = matches.filter(m => {
    const winner = players.find(p => p.id === m.winnerId)?.name.toLowerCase() || '';
    const participants = m.participantIds.map(id => players.find(p => p.id === id)?.name.toLowerCase() || '').join(' ');
    const query = search.toLowerCase();
    return winner.includes(query) || participants.includes(query);
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white">Battle Logs</h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Full registry of authorized arena encounters</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search fighters or sessions..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-red-600/50 font-bold"
          />
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="py-32 text-center bg-zinc-900/20 border border-zinc-800 border-dashed rounded-3xl">
           <History className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
           <p className="text-zinc-600 font-black uppercase text-xs tracking-widest">No entries found in archive</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map(match => {
            const winner = players.find(p => p.id === match.winnerId);
            const others = match.participantIds.filter(id => id !== match.winnerId).map(id => players.find(p => p.id === id));
            
            return (
              <div key={match.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-red-600/30 transition-all">
                <div className="flex items-center gap-6">
                  <div className="flex -space-x-3">
                    <img src={`https://mc-heads.net/avatar/${winner?.name}/32`} className="w-12 h-12 rounded-xl ring-4 ring-zinc-950 shadow-2xl relative z-10" alt="" />
                    {others.slice(0, 2).map((p, i) => (
                      <img key={p?.id} src={`https://mc-heads.net/avatar/${p?.name}/32`} className="w-10 h-10 rounded-lg ring-2 ring-zinc-950 grayscale opacity-40" alt="" />
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black italic text-zinc-100 text-lg uppercase tracking-tight">{winner?.name}</span>
                      <span className="text-[10px] font-black text-red-500 uppercase px-2 py-0.5 bg-red-500/10 rounded">Victory</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                      Defeated {others.length} warriors in {match.battleType}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                   <div className="hidden lg:block text-right">
                      <div className="flex items-center gap-2 text-zinc-400 font-black uppercase text-[10px] tracking-tighter justify-end">
                        <MapPin className="w-3 h-3" /> {match.location || 'Unknown Venue'}
                      </div>
                      <div className="text-[10px] text-zinc-600 font-bold uppercase mt-1">
                        {new Date(match.timestamp).toLocaleString()}
                      </div>
                   </div>
                   <div className="flex items-center gap-4 border-l border-zinc-800 pl-8">
                      <div className="text-right">
                        <div className="text-lg font-black font-mono text-green-400">+{match.eloGain}</div>
                        <div className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">{match.category}</div>
                      </div>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
