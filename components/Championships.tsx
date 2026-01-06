
import React from 'react';
import { Championship, Player } from '../types';
import { Trophy, Calendar, Medal } from 'lucide-react';
import { getAvatarUrl } from '../utils';

interface ChampsProps {
  champs: Championship[];
  players: Player[];
}

export const Championships: React.FC<ChampsProps> = ({ champs, players }) => {
  if (champs.length === 0) {
    return (
      <div className="text-center py-32 bg-zinc-900/20 border border-zinc-800 border-dashed rounded-3xl">
        <Trophy className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
        <h3 className="text-2xl font-black italic text-zinc-600 uppercase">No Championships Recorded</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {champs.sort((a, b) => b.timestamp - a.timestamp).map(champ => {
        const w = players.find(p => p.id === champ.winnerId);
        const s = players.find(p => p.id === champ.secondId);
        const t = players.find(p => p.id === champ.thirdId);
        
        return (
          <div key={champ.id} className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-8 backdrop-blur-sm shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform">
              <Trophy className="w-32 h-32 text-yellow-500" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-8 bg-red-600 rounded-full"></div>
                <div>
                  <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase">{champ.name}</h3>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Season: {champ.seasonKey}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* 1st Place */}
                <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-black font-black shadow-lg">1st</div>
                    <img src={getAvatarUrl(w?.skinName || w?.name || '')} className="w-10 h-10 rounded-lg border border-yellow-500/50" alt="" />
                    <span className="font-black italic text-yellow-500 text-lg">{w?.displayName || 'Unknown'}</span>
                  </div>
                  <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500/20" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 2nd Place */}
                  <div className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-300 rounded-lg flex items-center justify-center text-black font-black text-xs">2nd</div>
                      <img src={getAvatarUrl(s?.skinName || s?.name || '')} className="w-8 h-8 rounded" alt="" />
                      <span className="font-black italic text-zinc-300 text-sm">{s?.displayName || 'Unknown'}</span>
                    </div>
                    <Trophy className="w-4 h-4 text-zinc-300 fill-zinc-300/20" />
                  </div>
                  {/* 3rd Place */}
                  <div className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-700 rounded-lg flex items-center justify-center text-white font-black text-xs">3rd</div>
                      <img src={getAvatarUrl(t?.skinName || t?.name || '')} className="w-8 h-8 rounded" alt="" />
                      <span className="font-black italic text-amber-700 text-sm">{t?.displayName || 'Unknown'}</span>
                    </div>
                    <Trophy className="w-4 h-4 text-amber-700 fill-amber-700/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
