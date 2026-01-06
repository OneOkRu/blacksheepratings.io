
import React from 'react';
import { Player } from '../types';
import { Calendar, Star, Trophy, Users } from 'lucide-react';
import { getAvatarUrl } from '../utils';

interface PrimeTimelineProps {
  players: Player[];
}

export const PrimeTimeline: React.FC<PrimeTimelineProps> = ({ players }) => {
  const sortedPlayers = [...players].filter(p => p.primeTime).sort((a, b) => {
    const yearA = parseInt(a.primeTime?.match(/\d{4}/)?.[0] || '0');
    const yearB = parseInt(b.primeTime?.match(/\d{4}/)?.[0] || '0');
    return yearB - yearA;
  });

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
      <div className="text-center">
        <h2 className="text-5xl font-black italic tracking-tighter uppercase text-white mb-2">Era Chronicles</h2>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Mapping the legacy of dominant warriors across time</p>
      </div>

      <div className="relative">
        <div className="absolute left-[3.25rem] md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-red-600/50 via-zinc-800 to-transparent"></div>
        
        <div className="space-y-12">
          {sortedPlayers.map((player, index) => (
            <div key={player.id} className={`flex items-start gap-8 relative ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative z-10 shrink-0 shadow-2xl">
                 <Calendar className="w-6 h-6 text-red-500" />
              </div>
              
              <div className={`flex-1 bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] backdrop-blur-md group hover:border-red-600/50 transition-all ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                <div className={`flex flex-col gap-4 ${index % 2 === 0 ? '' : 'items-end'}`}>
                  <div className="flex items-center gap-4">
                    <img src={getAvatarUrl(player.name)} className="w-12 h-12 rounded-xl" alt="" />
                    <div className={index % 2 === 0 ? '' : 'text-right'}>
                      <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">{player.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{player.primeTime}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-zinc-500 text-xs font-medium leading-relaxed max-w-md">
                    Recognized as a premier combatant during this era, maintaining elite standing across {Object.keys(player.stats).length} seasons of recorded history.
                  </p>
                  <div className="flex gap-4">
                     <div className="flex flex-col">
                        <span className="text-xs font-black text-zinc-300">#{player.championships.length}</span>
                        <span className="text-[8px] text-zinc-600 uppercase font-black">Cups</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-xs font-black text-zinc-300">{player.era}</span>
                        <span className="text-[8px] text-zinc-600 uppercase font-black">Origin</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
