
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Player, PvPCategory, SeasonType } from '../types';
import { getAvatarUrl, getTierColor } from '../utils';
import { History, Play, Pause, FastForward, Rewind, Sparkles } from 'lucide-react';

interface EvolutionViewProps {
  players: Player[];
  category: PvPCategory;
}

export const EvolutionView: React.FC<EvolutionViewProps> = ({ players, category }) => {
  const allSeasonKeys = useMemo(() => {
    const keys = new Set<string>();
    players.forEach(p => {
      if (p.stats) {
        Object.keys(p.stats).forEach(k => keys.add(k));
      }
    });
    
    return Array.from(keys).sort((a, b) => {
      const [yearA, typeA] = a.split('-');
      const [yearB, typeB] = b.split('-');
      const yA = parseInt(yearA);
      const yB = parseInt(yearB);
      if (yA !== yB) return yA - yB;
      const order = [SeasonType.WINTER, SeasonType.SPRING, SeasonType.SUMMER, SeasonType.AUTUMN];
      return order.indexOf(typeA as SeasonType) - order.indexOf(typeB as SeasonType);
    });
  }, [players]);

  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (allSeasonKeys.length > 0 && currentIndex === -1) {
      setCurrentIndex(allSeasonKeys.length - 1);
    }
  }, [allSeasonKeys]);

  useEffect(() => {
    if (isPlaying && allSeasonKeys.length > 0) {
      playTimerRef.current = window.setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= allSeasonKeys.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
    }
    return () => { if (playTimerRef.current) clearInterval(playTimerRef.current); };
  }, [isPlaying, allSeasonKeys.length]);

  const currentKey = allSeasonKeys[currentIndex] || '';

  const chartData = useMemo(() => {
    if (!currentKey) return [];
    
    return players
      .map(p => {
        const seasonStats = p.stats?.[currentKey];
        if (!seasonStats) return null;
        
        const stats = seasonStats[category];
        if (!stats) return null;

        const tierWeights: Record<string, number> = { 'S': 4000, 'A': 3000, 'B': 2000, 'C': 1000, 'D': 0 };
        const power = (tierWeights[stats.tier] || 0) + stats.elo;

        return {
          id: p.id,
          name: p.displayName,
          skin: p.skinName || p.name,
          tier: stats.tier,
          elo: stats.elo,
          power,
          rank: stats.manualRank
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => {
        if (a.rank !== undefined && b.rank !== undefined) return a.rank - b.rank;
        if (a.rank !== undefined) return -1;
        if (b.rank !== undefined) return 1;
        return b.power - a.power;
      })
      .slice(0, 10);
  }, [players, currentKey, category]);

  if (allSeasonKeys.length === 0 || currentIndex === -1) {
    return (
      <div className="text-center py-48 bg-zinc-900/10 border border-zinc-800/40 border-dashed rounded-[4rem] animate-in fade-in duration-1000">
        <History className="w-20 h-20 text-zinc-800 mx-auto mb-8 opacity-20" />
        <h3 className="text-3xl font-black italic text-zinc-600 uppercase tracking-tighter">History Empty</h3>
      </div>
    );
  }

  const maxPower = 8000;

  return (
    <div className="space-y-6 animate-in fade-in duration-1000">
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-[2.5rem] p-6 sm:p-12 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8 relative z-10">
          <div>
            <h2 className="text-3xl md:text-5xl font-[1000] italic tracking-[-0.05em] uppercase text-white flex items-center gap-3">
              <Sparkles className="w-6 h-6 md:w-10 md:h-10 text-red-600 animate-pulse" />
              Era <span className="text-red-600">Evolution</span>
            </h2>
            <p className="text-zinc-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] mt-1">{category} Timeline</p>
          </div>

          <div className="bg-black/80 border border-zinc-800/50 px-6 py-4 rounded-2xl flex flex-col items-center min-w-[200px]">
             <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Temporal Phase</span>
             <span className="text-2xl md:text-3xl font-[1000] italic text-red-600 tracking-tighter uppercase">
               {currentKey.replace('-', ' ')}
             </span>
          </div>
        </div>

        <div className="relative h-[250px] md:h-[400px] flex items-end justify-between gap-1 sm:gap-4 px-2 sm:px-8 border-b border-zinc-800/20 pb-6 mb-8">
          {chartData.map((data) => (
            <div 
              key={`${data.id}-${currentIndex}`} 
              className="flex-1 flex flex-col items-center group relative transition-all duration-700"
              style={{ height: `${Math.max(15, (data.power / maxPower) * 100)}%` }}
            >
              <div className="mb-2 transition-all duration-500 group-hover:scale-110 z-20">
                <img src={getAvatarUrl(data.skin)} className="w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl border-2 border-zinc-900 shadow-xl" alt="" />
              </div>

              <div 
                className={`w-full max-w-[40px] rounded-t-lg transition-all duration-700 relative overflow-hidden ${
                  data.tier === 'S' ? 'bg-gradient-to-t from-yellow-900 via-yellow-600 to-yellow-400' :
                  data.tier === 'A' ? 'bg-gradient-to-t from-purple-900 via-purple-600 to-purple-400' :
                  data.tier === 'B' ? 'bg-gradient-to-t from-blue-900 via-blue-600 to-blue-400' :
                  data.tier === 'C' ? 'bg-gradient-to-t from-green-900 via-green-600 to-green-400' :
                  'bg-zinc-700'
                }`}
                style={{ height: '100%' }}
              ></div>

              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 overflow-hidden max-w-[40px] md:max-w-none">
                <span className="text-[6px] md:text-[8px] font-black uppercase text-zinc-500 whitespace-nowrap">
                  {data.name}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-black/60 border border-zinc-800/50 p-6 rounded-3xl shadow-2xl max-w-5xl mx-auto">
          <div className="flex flex-col xl:flex-row items-center gap-6">
             <div className="flex items-center gap-3 shrink-0">
               <button disabled={currentIndex <= 0} onClick={() => { setCurrentIndex(currentIndex - 1); setIsPlaying(false); }} className="p-3 bg-zinc-800/40 hover:bg-zinc-700 text-zinc-400 rounded-xl transition-all">
                 <Rewind className="w-5 h-5" />
               </button>
               <button onClick={() => setIsPlaying(!isPlaying)} className={`px-8 py-3 rounded-xl transition-all flex items-center gap-3 font-black text-[10px] tracking-widest ${isPlaying ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-black hover:scale-105'}`}>
                 {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                 {isPlaying ? 'PAUSE' : 'PLAY'}
               </button>
               <button disabled={currentIndex >= allSeasonKeys.length - 1} onClick={() => { setCurrentIndex(currentIndex + 1); setIsPlaying(false); }} className="p-3 bg-zinc-800/40 hover:bg-zinc-700 text-zinc-400 rounded-xl transition-all">
                 <FastForward className="w-5 h-5" />
               </button>
             </div>
             
             <div className="flex-1 w-full space-y-3">
               <div className="px-1 flex items-center justify-between text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                  <span>Temporal Axis</span>
                  <span className="text-red-600">{currentIndex + 1} / {allSeasonKeys.length}</span>
               </div>
               <input type="range" min="0" max={allSeasonKeys.length - 1} value={currentIndex} onChange={(e) => { setCurrentIndex(parseInt(e.target.value)); setIsPlaying(false); }} className="w-full h-1.5 bg-zinc-900 rounded-full appearance-none cursor-pointer accent-red-600" />
               <div className="flex flex-wrap gap-2 pt-1">
                  {allSeasonKeys.map((key, i) => (
                    <button key={key} onClick={() => { setCurrentIndex(i); setIsPlaying(false); }} className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-lg border transition-all ${i === currentIndex ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-300'}`}>
                      {key.replace('-', ' ')}
                    </button>
                  ))}
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
