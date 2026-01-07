import React, { useState, useRef } from 'react';
import { Player, PlayerEra, PvPCategory, PlayerStats, Championship, Season, SeasonType } from '../types';
import { Edit2, Trash2, X, Lock, Trophy, Download, Upload, Calendar, ChevronLeft, ChevronRight, Check, Medal, History, Sparkles, MapPin, Clock } from 'lucide-react';
import { getAvatarUrl, getSeasonKey, getSeasonIcon } from '../utils';

interface AdminPanelProps {
  players: Player[];
  champs: Championship[];
  onAdd: (name: string) => void;
  onUpdate: (id: string, updates: Partial<Player>) => void;
  onDelete: (id: string) => void;
  onAddChamp: (season: string, name: string, w: string, s: string, t: string) => void;
  onDeleteChamp: (id: string) => void;
  currentSeasonKey: string;
  onClose: () => void;
  onFullReset?: (players: Player[], champs: Championship[]) => void;
}

const AVAILABLE_TIERS = ['S', 'A', 'B', 'C', 'D'];

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  players, champs, onAdd, onUpdate, onDelete, onAddChamp, onDeleteChamp, currentSeasonKey, onClose, onFullReset 
}) => {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'PLAYERS' | 'CUPS'>('PLAYERS');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Состояния для Кубков
  const [champName, setChampName] = useState('');
  const [champWinner, setChampWinner] = useState('');
  const [champSecond, setChampSecond] = useState('');
  const [champThird, setChampThird] = useState('');

  // Состояние сезона редактирования
  const [editSeason, setEditSeason] = useState<Season>(() => {
    const [year, type] = currentSeasonKey.split('-');
    return { year: parseInt(year), type: type as SeasonType };
  });
  const targetKey = getSeasonKey(editSeason);

  // Состояния для редактирования игрока
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Player>>({});
  const [editTiers, setEditTiers] = useState<Record<string, string>>({});
  const [editManualRanks, setEditManualRanks] = useState<Record<string, string>>({});
  const [editElo, setEditElo] = useState<Record<string, string>>({});

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'vanillabox') setIsUnlocked(true);
    else alert('Неверный код');
  };

  const navigateEditSeason = (dir: number) => {
    const types = Object.values(SeasonType);
    const currIdx = types.indexOf(editSeason.type);
    let nextIdx = (currIdx + dir + 4) % 4;
    let nextYear = editSeason.year + (dir === 1 && currIdx === 3 ? 1 : dir === -1 && currIdx === 0 ? -1 : 0);
    setEditSeason({ year: nextYear, type: types[nextIdx] });
    setEditingId(null);
  };

  const startEdit = (player: Player) => {
    setEditingId(player.id);
    setEditData({ ...player });
    const sStats = player.stats[targetKey] || {};
    const tiers: Record<string, string> = {};
    const ranks: Record<string, string> = {};
    const elos: Record<string, string> = {};

    Object.values(PvPCategory).forEach(cat => {
      tiers[cat] = sStats[cat]?.tier || 'D';
      ranks[cat] = sStats[cat]?.manualRank?.toString() || '';
      elos[cat] = sStats[cat]?.elo?.toString() || '1200';
    });

    setEditTiers(tiers);
    setEditManualRanks(ranks);
    setEditElo(elos);
  };

  const handleSaveEdit = (id: string) => {
    const player = players.find(p => p.id === id);
    if (!player) return;
    const seasonStats = { ...(player.stats[targetKey] || {}) };

    Object.values(PvPCategory).forEach(cat => {
      const category = cat as PvPCategory;
      const rankVal = parseInt(editManualRanks[category]);
      const eloVal = parseInt(editElo[category]);

      seasonStats[category] = { 
        ...(seasonStats[category] || { wins: 0, losses: 0 }), 
        elo: !isNaN(eloVal) ? eloVal : 1200,
        tier: editTiers[category],
        manualRank: !isNaN(rankVal) ? rankVal : undefined
      };
    });

    onUpdate(id, { 
      ...editData, 
      stats: { ...player.stats, [targetKey]: seasonStats as any } 
    });
    setEditingId(null);
  };

  const handleExport = () => {
    const data = JSON.stringify({ players, champs }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `backup_${targetKey}.json`; a.click();
  };

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.displayName || '???';

  if (!isUnlocked) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 max-w-md mx-auto">
        <div className="flex flex-col items-center text-center gap-6">
          <Lock className="w-16 h-16 text-red-600" />
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Admin Access</h3>
          <form onSubmit={handleUnlock} className="w-full space-y-4">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Код..." className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-center text-white" />
            <button type="submit" className="w-full bg-red-600 text-white font-black py-3 rounded-xl uppercase">Войти</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
      {/* SEASON SELECTOR */}
      <div className="bg-red-600 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Calendar className="w-6 h-6 text-white" />
          <h4 className="text-2xl font-black italic text-white uppercase">{editSeason.type} {editSeason.year}</h4>
        </div>
        <div className="flex items-center gap-2 bg-black/20 p-2 rounded-2xl">
           <button onClick={() => navigateEditSeason(-1)} className="p-3 hover:bg-white/10 rounded-xl text-white"><ChevronLeft /></button>
           <button onClick={() => navigateEditSeason(1)} className="p-3 hover:bg-white/10 rounded-xl text-white"><ChevronRight /></button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <button onClick={() => setActiveTab('PLAYERS')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${activeTab === 'PLAYERS' ? 'bg-zinc-100 text-black' : 'text-zinc-500'}`}>Fighters</button>
        <button onClick={() => setActiveTab('CUPS')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${activeTab === 'CUPS' ? 'bg-zinc-100 text-black' : 'text-zinc-500'}`}>Hall of Fame</button>
      </div>

      {/* TAB 1: PLAYERS (С ПОЛНЫМИ ПОЛЯМИ) */}
      {activeTab === 'PLAYERS' && (
        <div className="space-y-6">
          <button onClick={handleExport} className="w-full bg-zinc-800 p-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors">
            <Download className="w-4 h-4" /> Export Database (JSON)
          </button>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex gap-4 mb-6">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Minecraft Nick..." className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white" />
              <button onClick={() => { if(newName){ onAdd(newName); setNewName(''); } }} className="bg-red-600 px-6 rounded-xl font-black">ADD</button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {players.map(player => (
                <div key={player.id} className={`p-6 rounded-3xl border ${editingId === player.id ? 'border-red-600 bg-red-600/5' : 'border-zinc-800 bg-black/40'}`}>
                  {editingId === player.id ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Display Name</label>
                           <input value={editData.displayName} onChange={e => setEditData({...editData, displayName: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm font-bold border border-zinc-800 text-white" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-red-500 ml-1">Suffix (e.g. Legend)</label>
                           <input value={editData.customRank || ''} onChange={e => setEditData({...editData, customRank: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm font-bold border border-red-900/30 text-red-500" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Location</label>
                           <input value={editData.location || ''} onChange={e => setEditData({...editData, location: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm font-bold border border-zinc-800 text-white" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Peak Period</label>
                           <input value={editData.primeTime || ''} onChange={e => setEditData({...editData, primeTime: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm font-bold border border-zinc-800 text-white" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                           <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Era</label>
                           <select value={editData.era} onChange={(e) => setEditData({...editData, era: e.target.value as any})} className="w-full bg-zinc-900 p-3 rounded-xl text-sm font-bold border border-zinc-800 text-white">
                              {['Старая школа', 'Новая школа', 'Новейшая школа', 'Вне эпох'].map(e => <option key={e} value={e}>{e}</option>)}
                           </select>
                        </div>
                      </div>
                      
                      <div className="border-t border-zinc-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.values(PvPCategory).map(cat => (
                          <div key={cat} className="bg-black/60 p-3 rounded-xl flex items-center gap-2">
                            <span className="text-[8px] font-black uppercase text-zinc-500 w-16 truncate">{cat}</span>
                            <select value={editTiers[cat]} onChange={e => setEditTiers({...editTiers, [cat]: e.target.value})} className="bg-zinc-900 text-[10px] p-1 rounded font-black text-white">
                              {AVAILABLE_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <input type="number" value={editElo[cat]} onChange={e => setEditElo({...editElo, [cat]: e.target.value})} className="w-16 bg-zinc-900 text-[10px] p-1 rounded text-center text-white" placeholder="ELO" />
                            <input type="number" value={editManualRanks[cat]} onChange={e => setEditManualRanks({...editManualRanks, [cat]: e.target.value})} className="w-12 bg-red-900/20 text-[10px] p-1 rounded text-center text-red-500 font-bold" placeholder="Rank" />
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => handleSaveEdit(player.id)} className="flex-1 bg-red-600 py-3 rounded-xl font-black uppercase text-[10px] text-white">Save Changes</button>
                        <button onClick={() => setEditingId(null)} className="px-6 bg-zinc-800 py-3 rounded-xl font-black uppercase text-[10px] text-white">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img src={getAvatarUrl(player.skinName || player.name)} className="w-12 h-12 rounded-xl" alt="" onError={e => e.currentTarget.src='https://mc-heads.net/avatar/Steve'} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black italic text-white">{player.displayName}</span>
                            {player.customRank && <span className="text-red-500 text-[8px] font-black uppercase px-1 bg-red-500/10 rounded">{player.customRank}</span>}
                          </div>
                          <span className="text-[9px] text-zinc-600 font-bold uppercase">{player.era} • {player.location || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(player)} className="p-3 bg-zinc-800/50 rounded-lg text-zinc-400 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { if(confirm('Удалить игрока?')) onDelete(player.id); }} className="p-3 bg-zinc-800/50 rounded-lg text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUPS (ВОССТАНОВЛЕНО И ИСПРАВЛЕНО) */}
      {activeTab === 'CUPS' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-yellow-500 font-black uppercase text-xs flex items-center gap-2"><Trophy className="w-4 h-4" /> Tournament Manager</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={champName} onChange={e => setChampName(e.target.value)} placeholder="Tournament Title..." className="bg-black border border-zinc-800 rounded-xl px-4 py-3 font-bold text-white" />
              <div className="bg-zinc-800/50 rounded-xl px-4 py-3 border border-zinc-800 text-zinc-500 font-black uppercase">{targetKey}</div>
              <select value={champWinner} onChange={e => setChampWinner(e.target.value)} className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-yellow-500 font-bold"><option value="">Gold Medal</option>{players.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}</select>
              <select value={champSecond} onChange={e => setChampSecond(e.target.value)} className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-zinc-300 font-bold"><option value="">Silver Medal</option>{players.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}</select>
              <select value={champThird} onChange={e => setChampThird(e.target.value)} className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-orange-600 font-bold"><option value="">Bronze Medal</option>{players.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}</select>
              <button onClick={handleAwardCups} className="bg-yellow-500 text-black font-black uppercase py-3 rounded-xl hover:bg-white transition-all">Submit Tournament</button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-zinc-500 font-black uppercase text-xs flex items-center gap-2"><History className="w-4 h-4" /> History</h3>
            <div className="grid grid-cols-1 gap-3">
              {champs.slice().reverse().map(c => (
                <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between group">
                  <div className="space-y-1">
                    <span className="text-white font-black uppercase text-sm">{c.name}</span>
                    <div className="flex gap-4 text-[10px] font-bold text-zinc-500">
                      <span className="text-yellow-500">1st: {getPlayerName(c.winnerId)}</span>
                      <span className="text-zinc-300">2nd: {getPlayerName(c.secondId)}</span>
                      <span className="text-orange-700">3rd: {getPlayerName(c.thirdId)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditChamp(c)} className="p-2 bg-zinc-800 rounded-lg text-zinc-500 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => { if(confirm('Удалить турнир и значки?')) onDeleteChamp(c.id); }} className="p-2 bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="text-center"><button onClick={onClose} className="text-zinc-600 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Close Panel</button></div>
    </div>
  );
};
