
import React, { useState, useRef } from 'react';
import { Player, PlayerEra, PvPCategory, PlayerStats, Championship, Season, SeasonType } from '../types';
import { Plus, Edit2, Trash2, X, Save, ShieldCheck, Star, Medal, Lock, Trophy, Download, Upload, Calendar, ChevronLeft, ChevronRight, Copy, Check, MapPin, Sparkles, Clock } from 'lucide-react';
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
      setTimeout(() => {
        setConfirmDeleteId(current => current === id ? null : current);
      }, 3000);
    }
  };

  const handleCreateChamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!champName || !champWinner) {
      alert('Название и победитель обязательны');
      return;
    }
    onAddChamp(targetKey, champName, champWinner, champSecond, champThird);
    setChampName('');
    setChampWinner('');
    setChampSecond('');
    setChampThird('');
    alert('Кубок успешно добавлен!');
  };

  const handleExport = () => {
    const data = JSON.stringify({ players, champs }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blacksheep_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);
        if (data.players && onFullReset) {
          onFullReset(data.players, data.champs || []);
          alert('Данные успешно импортированы!');
        } else {
          alert('Ошибка: Файл не содержит корректную базу игроков.');
        }
      } catch (err) {
        alert('Ошибка при чтении JSON файла.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopyToClipboard = () => {
    const data = JSON.stringify({ players, champs }, null, 2);
    navigator.clipboard.writeText(data).then(() => {
      alert('JSON скопирован в буфер обмена!');
    }).catch(() => {
      alert('Не удалось скопировать. Используйте кнопку Скачать.');
    });
  };

  if (!isUnlocked) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 max-w-md mx-auto shadow-2xl animate-in fade-in">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase">Admin Access</h3>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Требуется авторизация</p>
          </div>
          <form onSubmit={handleUnlock} className="w-full space-y-4">
            <input 
              type="password" 
              placeholder="Код доступа..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-center focus:outline-none focus:ring-2 focus:ring-red-600/30"
            />
            <button type="submit" className="w-full bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-500 transition-all uppercase tracking-widest text-xs">Войти</button>
            <button type="button" onClick={onClose} className="w-full text-zinc-600 text-[10px] font-bold uppercase tracking-widest hover:text-zinc-400">Отмена</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
      {/* Season Navigation */}
      <div className="bg-red-600 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_20px_50px_rgba(220,38,38,0.2)]">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-white/60 tracking-widest block leading-tight">Управление периодом</span>
            <h4 className="text-2xl font-black italic text-white uppercase tracking-tighter">
              {getSeasonIcon(editSeason.type)} {editSeason.type} {editSeason.year}
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/20 p-2 rounded-2xl">
           <button type="button" onClick={() => navigateEditSeason(-1)} className="p-3 hover:bg-white/10 rounded-xl transition-all text-white"><ChevronLeft className="w-5 h-5" /></button>
           <span className="px-4 text-[10px] font-black uppercase text-white border-x border-white/10">Сменить дату</span>
           <button type="button" onClick={() => navigateEditSeason(1)} className="p-3 hover:bg-white/10 rounded-xl transition-all text-white"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <button 
          onClick={() => setActiveTab('PLAYERS')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'PLAYERS' ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-200'}`}
        >
          <ShieldCheck className="w-4 h-4" /> Players Registry
        </button>
        <button 
          onClick={() => setActiveTab('CUPS')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'CUPS' ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-200'}`}
        >
          <Trophy className="w-4 h-4" /> Cup Management
        </button>
      </div>

      {activeTab === 'PLAYERS' ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button type="button" onClick={handleExport} className="bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-2xl border border-zinc-700 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Скачать JSON
            </button>
            <button type="button" onClick={handleCopyToClipboard} className="bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-2xl border border-zinc-700 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
              <Copy className="w-4 h-4" /> Копировать Код
            </button>
            <div className="relative">
              <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-2xl border border-zinc-700 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" /> Загрузить файл
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex gap-4 mb-8">
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ник нового игрока..." className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-red-600/50 transition-colors" />
              <button type="button" onClick={() => { if(newName){ onAdd(newName); setNewName(''); } }} className="bg-red-600 text-white font-black px-8 py-3 rounded-xl hover:bg-red-500 transition-all shadow-lg text-sm">СОЗДАТЬ</button>
            </div>

            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
              {players.map(player => {
                const currentStats = player.stats[targetKey]?.Overall;
                const isConfirming = confirmDeleteId === player.id;
                return (
                  <div key={player.id} className={`bg-black/40 border transition-all rounded-3xl p-6 ${editingId === player.id ? 'border-red-600/50 ring-1 ring-red-600/20' : isConfirming ? 'border-red-500 bg-red-500/5' : 'border-zinc-800'}`}>
                    {editingId === player.id ? (
                      <div className="space-y-8">
                        {/* Global Data */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-4">
                             <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Display Identity</label>
                                <input value={editData.displayName} onChange={e => setEditData({ ...editData, displayName: e.target.value })} placeholder="Отображаемое имя" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm font-bold" />
                             </div>
                             <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Minecraft Skin Name</label>
                                <input value={editData.skinName} onChange={e => setEditData({ ...editData, skinName: e.target.value })} placeholder="Ник скина (MC)" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm font-bold" />
                             </div>
                             <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Era / Origin</label>
                                <select value={editData.era} onChange={e => setEditData({ ...editData, era: e.target.value as PlayerEra })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm font-black uppercase">
                                  {Object.values(PlayerEra).map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                             </div>
                           </div>

                           <div className="space-y-4">
                             <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase text-red-500 ml-1 tracking-widest flex items-center gap-1"><Sparkles className="w-3 h-3" /> Custom Suffix (Rank/Title)</label>
                                <input value={editData.customRank || ''} onChange={e => setEditData({ ...editData, customRank: e.target.value })} placeholder="Напр. Legend, MVP" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm font-bold text-red-500" />
                             </div>
                             <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest flex items-center gap-1"><MapPin className="w-3 h-3" /> Location / Region</label>
                                <input value={editData.location || ''} onChange={e => setEditData({ ...editData, location: e.target.value })} placeholder="Напр. EU, RU, US" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm font-bold" />
                             </div>
                             <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> Peak Period (Prime Time)</label>
                                <input value={editData.primeTime || ''} onChange={e => setEditData({ ...editData, primeTime: e.target.value })} placeholder="Напр. 2023-2024" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm font-bold" />
                             </div>
                           </div>
                        </div>

                        {/* Season Stats & Ranking */}
                        <div className="border-t border-zinc-800 pt-6">
                           <div className="flex items-center justify-between mb-4">
                             <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">{targetKey} Statistics</h4>
                             <span className="text-[8px] text-zinc-600 font-bold uppercase">ELO / Tier / Rank Placement</span>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.values(PvPCategory).map(cat => (
                              <div key={cat} className="flex gap-2 items-center bg-zinc-900 p-3 rounded-2xl border border-zinc-800 group/cat">
                                <div className="w-20 shrink-0">
                                   <span className="text-[8px] font-black uppercase text-zinc-500 block truncate group-hover/cat:text-red-500 transition-colors">{cat}</span>
                                </div>
                                <select value={editTiers[cat]} onChange={e => setEditTiers({ ...editTiers, [cat]: e.target.value })} className="bg-black border border-zinc-800 rounded-lg p-1.5 text-[10px] font-black italic w-20">
                                  {AVAILABLE_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <div className="flex-1 flex gap-2">
                                   <div className="relative flex-1">
                                      <span className="absolute -top-2 left-2 px-1 bg-zinc-900 text-[6px] font-black text-zinc-600 uppercase">ELO</span>
                                      <input type="number" value={editElo[cat]} onChange={e => setEditElo({ ...editElo, [cat]: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-[10px] text-center font-bold" />
                                   </div>
                                   <div className="relative flex-1">
                                      <span className="absolute -top-2 left-2 px-1 bg-zinc-900 text-[6px] font-black text-red-600 uppercase">Rank</span>
                                      <input type="number" value={editManualRanks[cat]} onChange={e => setEditManualRanks({ ...editManualRanks, [cat]: e.target.value })} placeholder="-" className="w-full bg-black border border-red-900/30 rounded-lg p-2 text-[10px] text-center font-black text-red-500" />
                                   </div>
                                </div>
                              </div>
                            ))}
                           </div>
                        </div>

                        <div className="flex gap-3">
                          <button type="button" onClick={() => handleSaveEdit(player.id)} className="flex-1 bg-red-600 text-white font-[1000] py-5 rounded-2xl hover:bg-red-500 transition-all uppercase tracking-[0.2em] text-xs shadow-xl shadow-red-900/20">COMMIT CHANGES TO {targetKey}</button>
                          <button type="button" onClick={() => setEditingId(null)} className="px-8 bg-zinc-800 text-zinc-400 font-black rounded-2xl hover:text-white transition-all uppercase text-[10px]">CANCEL</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group/row">
                        <div className="flex items-center gap-4">
                          <img src={getAvatarUrl(player.skinName || player.name)} className="w-14 h-14 rounded-2xl border border-zinc-800 shadow-lg" alt="" />
                          <div>
                            <div className="flex items-center gap-2">
                               <span className="font-black italic text-white text-xl block leading-none">{player.displayName}</span>
                               {player.customRank && <span className="text-red-500 text-[8px] font-black uppercase px-1.5 py-0.5 bg-red-500/10 rounded border border-red-500/20">{player.customRank}</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                               <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">ELO: {currentStats?.elo || 'NONE'} [{currentStats?.tier || 'D'}]</span>
                               {player.location && <span className="flex items-center gap-1 text-[8px] text-zinc-500 font-bold uppercase"><MapPin className="w-3 h-3" />{player.location}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!isConfirming && <button type="button" onClick={() => startEdit(player)} className="p-4 bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-xl transition-all"><Edit2 className="w-5 h-5" /></button>}
                          <button type="button" onClick={() => handleDeleteClick(player.id)} className={`p-4 rounded-xl transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest ${isConfirming ? 'bg-red-600 text-white px-6' : 'bg-zinc-800/50 text-zinc-400 hover:text-red-500'}`}>
                            {isConfirming ? <><Check className="w-5 h-5" /> CONFIRM</> : <Trash2 className="w-5 h-5" />}
                          </button>
                          {isConfirming && <button type="button" onClick={() => setConfirmDeleteId(null)} className="p-4 bg-zinc-800 text-zinc-400 rounded-xl"><X className="w-5 h-5" /></button>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in fade-in duration-300">
           <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-800">
             <div>
               <h3 className="text-3xl font-black italic tracking-tight text-white uppercase">Cup Foundry</h3>
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Добавление кубков для сезона {targetKey}</p>
             </div>
             <Trophy className="w-10 h-10 text-yellow-500" />
           </div>

           <form onSubmit={handleCreateChamp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Cup Designation</label>
                <input 
                  type="text" 
                  value={champName} 
                  onChange={e => setChampName(e.target.value)} 
                  placeholder="Название кубка (напр. Black Sheep Cup I)" 
                  className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-white font-black italic text-lg focus:border-yellow-500/50 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-yellow-500 tracking-widest flex items-center gap-2"><Trophy className="w-3 h-3" /> Gold Medal (1st)</label>
                    <select value={champWinner} onChange={e => setChampWinner(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white font-bold appearance-none">
                      <option value="">Выберите игрока...</option>
                      {players.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2"><Medal className="w-3 h-3" /> Silver Medal (2nd)</label>
                    <select value={champSecond} onChange={e => setChampSecond(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white font-bold appearance-none">
                      <option value="">Выберите игрока...</option>
                      {players.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-amber-700 tracking-widest flex items-center gap-2"><Medal className="w-3 h-3" /> Bronze Medal (3rd)</label>
                    <select value={champThird} onChange={e => setChampThird(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white font-bold appearance-none">
                      <option value="">Выберите игрока...</option>
                      {players.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                    </select>
                 </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-[1000] italic uppercase tracking-widest py-6 rounded-2xl shadow-[0_10px_30px_rgba(234,179,8,0.2)] transition-all active:scale-[0.98] text-xl"
              >
                CREATE CHAMPIONSHIP
              </button>
           </form>

           <div className="mt-12">
              <h4 className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-4 border-b border-zinc-800 pb-2">Recent Records for this Season</h4>
              <div className="space-y-3">
                {champs.filter(c => c.seasonKey === targetKey).map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-black/40 border border-zinc-800 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="font-black italic text-zinc-200 uppercase">{c.name}</span>
                    </div>
                    <span className="text-[9px] font-black text-zinc-600 uppercase">Created: {new Date(c.timestamp).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
