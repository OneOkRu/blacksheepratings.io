
import React, { useState, useRef } from 'react';
import { Player, PlayerEra, PvPCategory, PlayerStats, Championship, Season, SeasonType } from '../types';
import { Edit2, Trash2, X, ShieldCheck, Lock, Trophy, Download, Upload, Calendar, ChevronLeft, ChevronRight, Copy, Check, MapPin, Sparkles, Clock } from 'lucide-react';
import { getAvatarUrl, getSeasonKey, getSeasonIcon } from '../utils';

interface AdminPanelProps {
  players: Player[];
  champs: Championship[];
  onAdd: (name: string) => void;
  onUpdate: (id: string, updates: Partial<Player>) => void;
  onDelete: (id: string) => void;
  onAddChamp: (season: string, name: string, w: string, s: string, t: string) => void;
  currentSeasonKey: string;
  onClose: () => void;
  onFullReset?: (players: Player[], champs: Championship[]) => void;
}

const AVAILABLE_TIERS = ['S', 'A', 'B', 'C', 'D'];

export const AdminPanel: React.FC<AdminPanelProps> = ({ players, champs, onAdd, onUpdate, onDelete, onAddChamp, currentSeasonKey, onClose, onFullReset }) => {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [champName, setChampName] = useState('');
  const [champWinner, setChampWinner] = useState('');
  const [champSecond, setChampSecond] = useState('');
  const [champThird, setChampThird] = useState('');
  const [activeTab, setActiveTab] = useState<'PLAYERS' | 'CUPS'>('PLAYERS');

  const [editSeason, setEditSeason] = useState<Season>(() => {
    const [year, type] = currentSeasonKey.split('-');
    return { year: parseInt(year), type: type as SeasonType };
  });
  const targetKey = getSeasonKey(editSeason);

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Player>>({});
  const [editTiers, setEditTiers] = useState<Record<string, string>>({});
  const [editManualRanks, setEditManualRanks] = useState<Record<string, string>>({});
  const [editElo, setEditElo] = useState<Record<string, string>>({});

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'vanillabox') {
      setIsUnlocked(true);
    } else {
      alert('Неверный код доступа');
    }
  };

  const navigateEditSeason = (dir: number) => {
    const types = Object.values(SeasonType);
    const currIdx = types.indexOf(editSeason.type);
    let nextIdx = (currIdx + dir + 4) % 4;
    let nextYear = editSeason.year + (dir === 1 && currIdx === 3 ? 1 : dir === -1 && currIdx === 0 ? -1 : 0);
    setEditSeason({ year: nextYear, type: types[nextIdx] });
    setEditingId(null); 
    setConfirmDeleteId(null);
  };

  const startEdit = (player: Player) => {
    setEditingId(player.id);
    setConfirmDeleteId(null);
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
        elo: !isNaN(eloVal) ? eloVal : (seasonStats[category]?.elo || 1200),
        tier: editTiers[category],
        manualRank: !isNaN(rankVal) ? rankVal : undefined
      };
    });

    onUpdate(id, { 
      ...editData, 
      stats: { ...player.stats, [targetKey]: seasonStats as Record<PvPCategory, PlayerStats> } 
    });
    setEditingId(null);
  };

  const handleDeleteClick = (id: string) => {
    if (confirmDeleteId === id) {
      onDelete(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleExport = () => {
    const data = JSON.stringify({ players, champs }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blacksheep_backup_${targetKey}.json`;
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.players && onFullReset) onFullReset(data.players, data.champs || []);
        alert('Данные импортированы!');
      } catch (err) { alert('Ошибка JSON'); }
    };
    reader.readAsText(file);
  };

  if (!isUnlocked) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 max-w-md mx-auto shadow-2xl">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase">Admin Access</h3>
          <form onSubmit={handleUnlock} className="w-full space-y-4">
            <input 
              type="password" 
              placeholder="Код доступа..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-red-600/30"
            />
            <button type="submit" className="w-full bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-500 uppercase tracking-widest text-xs">Войти</button>
            <button type="button" onClick={onClose} className="w-full text-zinc-600 text-[10px] font-bold uppercase hover:text-zinc-400">Отмена</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-red-600 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Calendar className="w-6 h-6 text-white" />
          <h4 className="text-2xl font-black italic text-white uppercase tracking-tighter">
            {getSeasonIcon(editSeason.type)} {editSeason.type} {editSeason.year}
          </h4>
        </div>
        <div className="flex items-center gap-2 bg-black/20 p-2 rounded-2xl">
           <button onClick={() => navigateEditSeason(-1)} className="p-3 hover:bg-white/10 rounded-xl text-white"><ChevronLeft className="w-5 h-5" /></button>
           <span className="px-4 text-[10px] font-black uppercase text-white border-x border-white/10">Период</span>
           <button onClick={() => navigateEditSeason(1)} className="p-3 hover:bg-white/10 rounded-xl text-white"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <button onClick={() => setActiveTab('PLAYERS')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${activeTab === 'PLAYERS' ? 'bg-zinc-100 text-black' : 'text-zinc-500'}`}>Players Registry</button>
        <button onClick={() => setActiveTab('CUPS')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${activeTab === 'CUPS' ? 'bg-zinc-100 text-black' : 'text-zinc-500'}`}>Cups</button>
      </div>

      {activeTab === 'PLAYERS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={handleExport} className="bg-zinc-800 p-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"><Download className="w-4 h-4" /> JSON</button>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="bg-zinc-800 p-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Import</button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex gap-4 mb-6">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ник..." className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2" />
              <button onClick={() => { if(newName){ onAdd(newName); setNewName(''); } }} className="bg-red-600 px-6 rounded-xl font-black">ADD</button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {players.map(player => (
                <div key={player.id} className={`p-6 rounded-3xl border ${editingId === player.id ? 'border-red-600 bg-red-600/5' : 'border-zinc-800 bg-black/40'}`}>
                  {editingId === player.id ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input value={editData.displayName} onChange={e => setEditData({...editData, displayName: e.target.value})} placeholder="Display Name" className="bg-zinc-900 p-3 rounded-xl text-sm font-bold border border-zinc-800" />
                        <input value={editData.customRank || ''} onChange={e => setEditData({...editData, customRank: e.target.value})} placeholder="Suffix (e.g. Legend)" className="bg-zinc-900 p-3 rounded-xl text-sm font-bold border border-red-900/30 text-red-500" />
                        <input value={editData.location || ''} onChange={e => setEditData({...editData, location: e.target.value})} placeholder="Location (RU, EU...)" className="bg-zinc-900 p-3 rounded-xl text-sm font-bold border border-zinc-800" />
                        <input value={editData.primeTime || ''} onChange={e => setEditData({...editData, primeTime: e.target.value})} placeholder="Peak Period (2023-2024)" className="bg-zinc-900 p-3 rounded-xl text-sm font-bold border border-zinc-800" />
                      </div>
                      
                      <div className="border-t border-zinc-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.values(PvPCategory).map(cat => (
                          <div key={cat} className="bg-black/60 p-3 rounded-xl flex items-center gap-2">
                            <span className="text-[8px] font-black uppercase text-zinc-500 w-16 truncate">{cat}</span>
                            <select value={editTiers[cat]} onChange={e => setEditTiers({...editTiers, [cat]: e.target.value})} className="bg-zinc-900 text-[10px] p-1 rounded font-black">
                              {AVAILABLE_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <input type="number" value={editElo[cat]} onChange={e => setEditElo({...editElo, [cat]: e.target.value})} className="w-16 bg-zinc-900 text-[10px] p-1 rounded text-center" placeholder="ELO" />
                            <input type="number" value={editManualRanks[cat]} onChange={e => setEditManualRanks({...editManualRanks, [cat]: e.target.value})} className="w-12 bg-red-900/20 text-[10px] p-1 rounded text-center text-red-500 font-bold" placeholder="Rank" title="Manual Placement" />
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => handleSaveEdit(player.id)} className="flex-1 bg-red-600 py-3 rounded-xl font-black uppercase text-[10px]">Save Changes</button>
                        <button onClick={() => setEditingId(null)} className="px-6 bg-zinc-800 py-3 rounded-xl font-black uppercase text-[10px]">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img src={getAvatarUrl(player.skinName || player.name)} className="w-12 h-12 rounded-xl" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black italic text-white">{player.displayName}</span>
                            {player.customRank && <span className="text-red-500 text-[8px] font-black uppercase px-1 bg-red-500/10 rounded">{player.customRank}</span>}
                          </div>
                          <span className="text-[9px] text-zinc-600 font-bold uppercase">{player.location || 'Unknown'} • {player.primeTime || 'TBD'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(player)} className="p-3 bg-zinc-800/50 rounded-lg text-zinc-400 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteClick(player.id)} className={`p-3 rounded-lg transition-all ${confirmDeleteId === player.id ? 'bg-red-600 text-white' : 'bg-zinc-800/50 text-zinc-400'}`}>
                          {confirmDeleteId === player.id ? <Check className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
