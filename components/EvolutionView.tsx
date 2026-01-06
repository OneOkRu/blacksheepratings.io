
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Player, PvPCategory, SeasonType } from '../types';
import { getAvatarUrl, getTierColor } from '../utils';
import { History, Play, Pause, FastForward, Rewind, Info, Sparkles } from 'lucide-react';

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
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4 max-w-sm mx-auto">
          Для активации этой вкладки добавьте данные игрокам для прошлых сезонов.
        </p>
      </div>
    );
  }

  const maxPower = 8000;

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-1000">
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-[2.5rem] md:rounded-[4rem] p-6 sm:p-8 lg:p-16 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/30 to-transparent"></div>
        
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-12 relative z-10">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-[1000] italic tracking-[-0.05em] uppercase text-white flex items-center gap-3 justify-center lg:justify-start">
              <Sparkles className="w-6 h-6 md:w-10 md:h-10 text-red-600 animate-pulse" />
              Era <span className="text-red-600">Evolution</span>
            </h2>
            <p className="text-zinc-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] mt-1">Historic Power Graph: {category}</p>
          </div>

          <div className="bg-black/80 border border-zinc-800/50 px-6 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] flex flex-col items-center min-w-[200px] md:min-w-[280px] shadow-2xl ring-1 ring-white/5">
             <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Temporal Phase</span>
             <span className="text-2xl md:text-4xl font-[1000] italic text-red-600 tracking-tighter uppercase">
               {currentKey.replace('-', ' ')}
             </span>
          </div>
        </div>

        {/* Chart Area */}
        <div className="relative h-[300px] sm:h-[400px] md:h-[450px] flex items-end justify-between gap-1 sm:gap-4 px-2 sm:px-8 border-b border-zinc-800/20 pb-8 mb-10 md:mb-16">
          {chartData.map((data, idx) => (
            <div 
              key={`${data.id}-${currentIndex}`} 
              className="flex-1 flex flex-col items-center group relative transition-all duration-[1200ms] ease-out"
              style={{ height: `${Math.max(15, (data.power / maxPower) * 100)}%` }}
            >
              {/* Tooltip */}
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 bg-white text-black p-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-30 shadow-2xl min-w-[140px] text-center hidden sm:block">
                <div className="text-[9px] font-black uppercase text-zinc-400 mb-1">{data.name}</div>
                <div className="text-2xl font-[1000] italic tracking-tighter">{data.elo} PTS</div>
                <div className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg mt-1 bg-black ${getTierColor(data.tier)}`}>{data.tier} TIER</div>
              </div>

              <div className="mb-4 sm:mb-6 transition-all duration-700 group-hover:scale-110 z-20">
                <img src={getAvatarUrl(data.skin)} className="w-7 h-7 sm:w-16 sm:h-16 rounded-lg sm:rounded-[1.5rem] border-2 sm:border-4 border-zinc-900 shadow-2xl bg-zinc-800" alt="" />
              </div>

              <div 
                className={`w-full max-w-[35px] sm:max-w-[60px] rounded-t-lg sm:rounded-t-[1.5rem] transition-all duration-[1200ms] relative overflow-hidden group-hover:brightness-110 shadow-2xl ${
                  data.tier === 'S' ? 'bg-gradient-to-t from-yellow-900/40 via-yellow-600 to-yellow-400' :
                  data.tier === 'A' ? 'bg-gradient-to-t from-purple-900/40 via-purple-600 to-purple-400' :
                  data.tier === 'B' ? 'bg-gradient-to-t from-blue-900/40 via-blue-600 to-blue-400' :
                  data.tier === 'C' ? 'bg-gradient-to-t from-green-900/40 via-green-600 to-green-400' :
                  'bg-gradient-to-t from-zinc-800 via-zinc-600 to-zinc-500'
                }`}
                style={{ height: '100%' }}
              >
                <div className="absolute inset-0 bg-white/5 mix-blend-overlay"></div>
              </div>

              <div className="absolute -bottom-8 sm:-bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap overflow-hidden max-w-[40px] sm:max-w-none">
                <span className="text-[6px] sm:text-[10px] font-[1000] uppercase tracking-widest text-zinc-500 group-hover:text-white truncate">
                  {data.name}
                </span>
              </div>
            </div>
          ))}

          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between text-[6px] sm:text-[9px] font-black text-zinc-800/20 uppercase tracking-[0.4em] py-8">
            <div className="border-t border-zinc-800/5 w-full pt-1">S TIER</div>
            <div className="border-t border-zinc-800/5 w-full pt-1">A TIER</div>
            <div className="border-t border-zinc-800/5 w-full pt-1">B TIER</div>
            <div className="border-t border-zinc-800/5 w-full pt-1">C TIER</div>
            <div className="border-t border-zinc-800/5 w-full pt-1">D TIER</div>
          </div>
        </div>

        {/* Temporal Control Unit */}
        <div className="bg-black/60 border border-zinc-800/50 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl max-w-6xl mx-auto">
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-6 md:gap-8">
             
             {/* Playback Controls */}
             <div className="flex items-center justify-center gap-3 sm:gap-4 order-2 xl:order-1 shrink-0">
               <button 
                 disabled={currentIndex <= 0}
                 onClick={() => { setCurrentIndex(currentIndex - 1); setIsPlaying(false); }} 
                 className="p-3 sm:p-4 bg-zinc-800/40 hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-5 rounded-xl transition-all active:scale-95"
               >
                 <Rewind className="w-5 h-5 sm:w-6 sm:h-6" />
               </button>

               <button 
                 onClick={() => setIsPlaying(!isPlaying)} 
                 className={`flex-1 sm:flex-none px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] transition-all shadow-xl flex items-center justify-center gap-3 sm:gap-4 font-black uppercase text-[9px] sm:text-[11px] tracking-widest ${isPlaying ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-black hover:scale-105 active:scale-95'}`}
               >
                 {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />}
                 <span className="sm:inline">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
               </button>
               
               <button 
                 disabled={currentIndex >= allSeasonKeys.length - 1}
                 onClick={() => { setCurrentIndex(currentIndex + 1); setIsPlaying(false); }} 
                 className="p-3 sm:p-4 bg-zinc-800/40 hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:opacity-5 rounded-xl transition-all active:scale-95"
               >
                 <FastForward className="w-5 h-5 sm:w-6 sm:h-6" />
               </button>
             </div>
             
             {/* Timeline Engine (Temporal Axis) */}
             <div className="flex-1 order-1 xl:order-2 space-y-4">
               <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-zinc-600" />
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Temporal Axis</span>
                  </div>
                  <div className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-600/10 px-2.5 py-1 rounded-md border border-red-600/20">
                    {currentIndex + 1} / {allSeasonKeys.length}
                  </div>
               </div>
               
               <div className="px-1">
                 <input 
                   type="range" 
                   min="0" 
                   max={allSeasonKeys.length - 1} 
                   value={currentIndex}
                   onChange={(e) => { setCurrentIndex(parseInt(e.target.value)); setIsPlaying(false); }}
                   className="w-full h-1.5 sm:h-2 bg-zinc-900 rounded-full appearance-none cursor-pointer accent-red-600 transition-all hover:bg-zinc-800"
                 />
               </div>

               {/* Responsive Season Chips - WRAPPING ENABLED */}
               <div className="flex flex-wrap gap-2 pt-2 px-1">
                  {allSeasonKeys.map((key, i) => (
                    <button 
                      key={key} 
                      className={`text-[8px] sm:text-[10px] font-black uppercase whitespace-nowrap px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg border-2 transition-all ${
                        i === currentIndex 
                          ? 'text-white bg-red-600 border-red-600 shadow-lg scale-105' 
                          : 'text-zinc-600 border-zinc-800/50 hover:text-zinc-300 hover:border-zinc-700 bg-zinc-900/20'
                      }`}
                      onClick={() => { setCurrentIndex(i); setIsPlaying(false); }}
                    >
                      {key.replace('-', ' ')}
                    </button>
                  ))}
               </div>
             </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-8 opacity-20 text-[8px] font-black uppercase tracking-[0.3em]">
        <div className="flex items-center gap-2"><Sparkles className="w-2.5 h-2.5" /> Interpolation: Enabled</div>
        <div className="flex items-center gap-2"><History className="w-2.5 h-2.5" /> Database: Static</div>
      </div>
    </div>
  );
};
