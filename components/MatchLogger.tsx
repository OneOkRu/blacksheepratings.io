
import React, { useState } from 'react';
import { Player, PvPCategory, BattleType } from '../types';
import { X, Shield, Gem, Swords, MapPin, Users, UserMinus } from 'lucide-react';

interface MatchLoggerProps {
  players: Player[];
  onRecord: (winnerId: string, participants: string[], type: BattleType, category: Exclude<PvPCategory, PvPCategory.OVERALL>, location?: string) => void;
  onClose: () => void;
}

export const MatchLogger: React.FC<MatchLoggerProps> = ({ players, onRecord, onClose }) => {
  const [winnerId, setWinnerId] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [battleType, setBattleType] = useState<BattleType>(BattleType.DUEL);
  const [category, setCategory] = useState<Exclude<PvPCategory, PvPCategory.OVERALL>>(PvPCategory.AXE_SHIELD);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (winnerId && participants.length >= 2 && participants.includes(winnerId)) {
      onRecord(winnerId, participants, battleType, category, location.trim());
    } else {
      alert('Must select at least 2 participants including the winner');
    }
  };

  const toggleParticipant = (id: string) => {
    setParticipants(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const categories = [
    { id: PvPCategory.AXE_SHIELD, icon: Shield },
    { id: PvPCategory.DIAMOND, icon: Gem },
    { id: PvPCategory.NETHERITE, icon: Swords },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
        <h3 className="text-4xl font-black italic tracking-tighter mb-10 text-white uppercase">Dispatch Center</h3>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Battle Configuration</label>
              <div className="flex gap-2">
                {[BattleType.DUEL, BattleType.FFA].map(t => (
                  <button key={t} type="button" onClick={() => {setBattleType(t); setParticipants([]); setWinnerId('');}} 
                    className={`flex-1 py-3 rounded-xl border font-black italic text-xs uppercase tracking-widest transition-all ${battleType === t ? 'bg-zinc-100 text-black border-zinc-100' : 'bg-black border-zinc-800 text-zinc-500'}`}>
                    {t.split(' ')[0]}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Equipment</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(({ id, icon: Icon }) => (
                    <button key={id} type="button" onClick={() => setCategory(id as any)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${category === id ? 'bg-red-600 border-red-600 text-white' : 'bg-black border-zinc-800 text-zinc-500'}`}>
                      <Icon className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase">{id.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Venue</label>
                 <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Map / Server Name" className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm font-bold" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Participant Roster ({participants.length})</label>
              <div className="grid grid-cols-2 gap-2 h-64 overflow-y-auto pr-2 custom-scrollbar border border-zinc-800 rounded-2xl p-4 bg-black/40">
                {players.map(p => (
                  <button key={p.id} type="button" onClick={() => toggleParticipant(p.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-[10px] font-bold border transition-all ${participants.includes(p.id) ? 'bg-red-600 border-red-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                    <img src={`https://mc-heads.net/avatar/${p.name}/16`} className="w-4 h-4 rounded-sm" alt="" />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
              {participants.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Victor Select</label>
                  <select value={winnerId} onChange={e => setWinnerId(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm font-black italic text-red-500" required>
                    <option value="">Designate Winner...</option>
                    {participants.map(id => {
                      const p = players.find(pl => pl.id === id);
                      return <option key={id} value={id}>{p?.name}</option>;
                    })}
                  </select>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="w-full bg-white text-black font-black italic tracking-widest py-6 rounded-2xl shadow-2xl transition-all active:scale-95 text-xl uppercase">
            Execute Battle Record
          </button>
        </form>
      </div>
    </div>
  );
};
