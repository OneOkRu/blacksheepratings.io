import React, { useState, useRef } from 'react';
import { Player, PlayerEra, PvPCategory, PlayerStats, Championship, Season, SeasonType } from '../types';
import { Edit2, Trash2, Lock, Trophy, Download, Upload, Calendar, ChevronLeft, ChevronRight, Check, Medal, History } from 'lucide-react';
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

  // Форма кубков
  const [champName, setChampName] = useState('');
  const [champWinner, setChampWinner] = useState('');
  const [champSecond, setChampSecond] = useState('');
  const [champThird, setChampThird] = useState('');

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
    if (password === 'vanillabox') setIsUnlocked(true);
    else alert('Неверный код доступа');
  };

  const handleAwardCups = () => {
    if (!champName || !champWinner) {
      alert("Название турнира и Победитель обязательны!");
      return;
    }
    onAddChamp(targetKey, champName, champWinner, champSecond, champThird);
    setChampName(''); setChampWinner(''); setChampSecond(''); setChampThird('');
    alert("Результаты сохранены!");
  };

  const handleEditChamp = (c: Championship) => {
    setChampName(c.name);
    setChampWinner(c.winnerId);
    setChampSecond(c.secondId);
    setChampThird(c.thirdId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.displayName || '???';

  const navigateEditSeason = (dir: number) => {
    const types = Object.values(SeasonType);
    const currIdx = types.indexOf(editSeason.type);
    let nextIdx = (currIdx + dir + 4) % 4;
    let nextYear = editSeason.year + (dir === 1 && currIdx === 3 ? 1 : dir === -1 && currIdx === 0 ? -1 : 0);
    setEditSeason({ year: nextYear, type: types[nextIdx] });
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
    setEditTiers(tiers); setEditManualRanks(ranks); setEditElo(elos);
  };

  const handleSaveEdit = (id: string) => {
    const player = players.find(p => p.id === id);
    if (!player) return;
    const seasonStats = { ...(player.stats[targetKey] || {}) };
    Object.values(PvPCategory).forEach(cat => {
      const category = cat as PvPCategory;
      seasonStats[category] = { 
        ...(seasonStats[category] || { wins: 0, losses: 0 }), 
        elo: parseInt(editElo[category]) || 1200,
        tier: editTiers[category],
        manualRank: parseInt(editManualRanks[category]) || undefined
      };
    });
    onUpdate(id, { ...editData, stats: { ...player.stats, [targetKey]: seasonStats as any } });
    setEditingId(null);
  };

  const handleExport = () => {
    const data = JSON.stringify({ players, champs }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${targetKey}.json`;
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
        alert('Импорт завершен!');
      } catch (err) { alert('Ошибка JSON'); }
    };
    reader.readAsText(file);
  };

  if (!isUnlocked) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 max-w-md mx-auto shadow-2xl">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center"><Lock className="w-8 h-8 text-red-600" /></div>
          <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase">Admin</h3>
          <form onSubmit={handleUnlock} className="w-full space-y-4">
            <input type="password" placeholder="Код..." value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-center focus:outline-none" />
            <button type="submit" className="w-full bg-red-600 text-white font-black py-3 rounded-xl uppercase tracking-widest">Enter</button>
            <button type="button" onClick={onClose} className="w-full text-zinc-600 text-[10px] font-bold uppercase">Back</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-red-600 rounded-3xl p-6 flex items-center justify-between">
        <h4 className="text-2xl font-black italic text-white uppercase tracking-tighter">{getSeasonIcon(editSeason.type)} {editSeason.type} {editSeason.year}</h4>
        <div className="flex gap-2 bg-black/20 p-2 rounded-2xl">
           <button onClick={() => navigateEditSeason(-1)} className="p-3 hover:bg-white/10 rounded-xl text-white"><ChevronLeft className="w-5 h-5" /></button>
           <button onClick={() => navigateEditSeason(1)} className="p-3 hover:bg-white/10 rounded-xl text-white"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <button onClick={() => setActiveTab('PLAYERS')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${activeTab === 'PLAYERS' ? 'bg-zinc-100 text-black' : 'text-zinc-500'}`}>Registry</button>
        <button onClick={() => setActiveTab('CUPS')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${activeTab === 'CUPS' ? 'bg-zinc-100 text-black' : 'text-zinc-500'}`}>Cups</button>
      </div>

      {activeTab === 'PLAYERS' && (
        <div className="space-y-6">
           <div className="grid grid-cols-2 gap-4">
            <button onClick={handleExport} className="bg-zinc-800 p-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Export</button>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="bg-zinc-800 p-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Import</button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex gap-4 mb-6">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Player Nick..." className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2" />
              <button onClick={() => { if(newName){ onAdd(newName); setNewName(''); } }} className="bg-red-600 px-6 rounded-xl font-black uppercase">Add</button>
            </div>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {players.map(player => (
                <div key={player.id} className={`p-4 rounded-2xl border ${editingId === player.id ? 'border-red-600 bg-red-600/5' : 'border-zinc-800 bg-black/20'}`}>
                  {editingId === player.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <input value={editData.displayName} onChange={e => setEditData({...editData, displayName: e.target.value})} className="bg-zinc-900 p-2 rounded-lg text-xs" />
                        <select value={editData.era} onChange={(e) => setEditData({...editData, era: e.target.value as any})} className="bg-zinc-900 p-2 rounded-lg text-xs text-white">
                          {['Старая школа', 'Новая школа', 'Новейшая школа', 'Вне эпох'].map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                      <button onClick={() => handleSaveEdit(player.id)} className="w-full bg-red-600 py-2 rounded-lg font-black text-[10px] uppercase">Save</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={getAvatarUrl(player.skinName || player.name)} className="w-10 h-10 rounded-lg" alt="" />
                        <span className="font-bold text-sm text-white">{player.displayName}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(player)} className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"><Edit2 className="w-3 h-3" /></button>
                        <button onClick={() => { if(confirm('Delete player?')) onDelete(player.id); }} className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'CUPS' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-yellow-500 font-black uppercase text-xs flex items-center gap-2"><Trophy className="w-4 h-4" /> Award Terminal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={champName} onChange={e => setChampName(e.target.value)} placeholder="Tournament Name..." className="bg-black border border-zinc-800 rounded-xl px-4 py-3 font-bold text-white" />
              <div className="bg-zinc-800/50 rounded-xl px-4 py-3 border border-zinc-800 text-zinc-500 font-black">{targetKey}</div>
              <select value={champWinner} onChange={e => setChampWinner(e.target.value)} className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-yellow-500 font-bold"><option value="">Gold Medalist</option>{players.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}</select>
              <select value={champSecond} onChange={e => setChampSecond(e.target.value)} className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-zinc-300 font-bold"><option value="">Silver Medalist</option>{players.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}</select>
              <select value={champThird} onChange={e => setChampThird(e.target.value)} className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-orange-600 font-bold"><option value="">Bronze Medalist</option>{players.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}</select>
              <button onClick={handleAwardCups} className="bg-yellow-500 text-black font-black uppercase py-3 rounded-xl hover:bg-white transition-all">Submit Results</button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-zinc-500 font-black uppercase text-xs flex items-center gap-2"><History className="w-4 h-4" /> Tournament Records</h3>
            <div className="grid grid-cols-1 gap-3">
              {champs.slice().reverse().map(c => (
                <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-white font-black uppercase text-sm tracking-tighter">{c.name}</span>
                    <div className="flex gap-4 text-[10px] font-bold text-zinc-500">
                      <span className="text-yellow-500">1st: {getPlayerName(c.winnerId)}</span>
                      <span className="text-zinc-300">2nd: {getPlayerName(c.secondId)}</span>
                      <span className="text-orange-700">3rd: {getPlayerName(c.thirdId)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditChamp(c)} className="p-2 bg-zinc-800 rounded-lg text-zinc-500 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => { if(confirm('Remove tournament and badges?')) onDeleteChamp(c.id); }} className="p-2 bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="text-center"><button onClick={onClose} className="text-zinc-600 font-black uppercase text-[9px] tracking-widest hover:text-white transition-colors">Exit Terminal</button></div>
    </div>
  );
};
