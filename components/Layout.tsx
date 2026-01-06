
import React, { useState, useEffect } from 'react';
import { Shield, UserCog, History, Trophy, LayoutDashboard, Zap, Activity, Menu, X, ListOrdered } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onAdminToggle: () => void;
  isAdminActive: boolean;
  onLogToggle: () => void;
  isLogActive: boolean;
  activeView: ViewState;
  onViewChange: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, onAdminToggle, isAdminActive, onLogToggle, isLogActive, activeView, onViewChange
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';
    }
    return () => { 
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';
    };
  }, [isMobileMenuOpen]);

  const navigationItems = [
    { id: 'LADDER' as ViewState, label: 'Ladder', icon: LayoutDashboard },
    { id: 'RANKING' as ViewState, label: 'Ranking', icon: ListOrdered },
    { id: 'EVOLUTION' as ViewState, label: 'Evolution', icon: Activity },
    { id: 'HISTORY' as ViewState, label: 'Log', icon: History },
    { id: 'CHAMPS' as ViewState, label: 'Cups', icon: Trophy },
  ];

  const handleNavClick = (view: ViewState) => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#060606] text-zinc-100 selection:bg-red-600/50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-red-600/10 blur-[150px] rounded-full"></div>
      </div>

      <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-black/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 md:h-24 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 md:gap-5 cursor-pointer group" 
            onClick={() => handleNavClick('LADDER')}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-red-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-zinc-800 to-black border border-zinc-700 rounded-lg md:rounded-xl flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-300">
                <Shield className="w-6 h-6 md:w-7 md:h-7 text-red-600" />
              </div>
            </div>
            
            <div className="flex flex-col -space-y-1 md:-space-y-1.5">
              <div className="flex items-baseline">
                <span className="text-2xl md:text-3xl font-[900] tracking-[-0.05em] uppercase italic text-white">
                  BLACK
                </span>
                <span className="text-2xl md:text-3xl font-[900] tracking-[-0.05em] uppercase italic text-red-600">
                  SHEEP
                </span>
              </div>
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 ml-0.5">
                Elite Ratings
              </span>
            </div>
          </div>
          
          <nav className="hidden xl:flex items-center gap-2">
            {navigationItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => handleNavClick(item.id)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border ${activeView === item.id ? 'bg-white text-black border-white' : 'text-zinc-500 border-transparent hover:text-zinc-200 hover:bg-zinc-900'}`}
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </button>
            ))}
            <div className="w-[1px] h-8 bg-zinc-800/50 mx-2"></div>
            <div className="flex items-center gap-2">
              <button onClick={onLogToggle} className={`p-3 rounded-xl transition-all border ${isLogActive ? 'bg-zinc-100 text-black border-white' : 'text-zinc-500 border-zinc-800 hover:text-white hover:bg-zinc-900'}`} title="Log Match">
                <Shield className="w-5 h-5" />
              </button>
              <button onClick={onAdminToggle} className={`p-3 rounded-xl transition-all border ${isAdminActive ? 'bg-red-600 text-white border-red-500' : 'text-zinc-500 border-zinc-800 hover:text-white hover:bg-zinc-900'}`} title="Admin Control">
                <UserCog className="w-5 h-5" />
              </button>
            </div>
          </nav>

          <div className="xl:hidden flex items-center gap-3">
             <button 
               onClick={onLogToggle} 
               className={`p-3 rounded-lg border transition-colors ${isLogActive ? 'bg-zinc-100 text-black border-white' : 'text-zinc-500 border-zinc-800 bg-zinc-900'}`}
             >
               <Shield className="w-6 h-6" />
             </button>
             <button 
               onClick={() => setIsMobileMenuOpen(true)} 
               className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
             >
               <Menu className="w-7 h-7" />
             </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="xl:hidden fixed inset-0 bg-[#060606] z-[100] flex flex-col animate-in fade-in duration-300">
            <div className="flex items-center justify-end h-24 px-6 shrink-0">
              <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-white active:scale-90 transition-transform"
              >
                <X className="w-10 h-10" />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center px-8">
              <div className="w-full max-w-sm mx-auto space-y-4">
                {navigationItems.map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => handleNavClick(item.id)} 
                    className={`w-full flex items-center justify-between px-10 py-6 md:py-8 rounded-[2rem] text-2xl font-[900] uppercase tracking-[0.15em] transition-all border ${activeView === item.id ? 'bg-red-600 text-white border-red-500 shadow-[0_20px_50px_rgba(220,38,38,0.4)]' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}
                  >
                    <div className="flex items-center gap-6">
                      <item.icon className={`w-8 h-8 ${activeView === item.id ? 'text-white' : 'text-red-600'}`} />
                      {item.label}
                    </div>
                    {activeView === item.id && <Zap className="w-6 h-6 fill-white animate-pulse" />}
                  </button>
                ))}
                
                <div className="h-[2px] bg-zinc-900 my-8 w-1/2 mx-auto"></div>
                
                <button 
                  onClick={() => { onAdminToggle(); setIsMobileMenuOpen(false); }} 
                  className={`w-full flex items-center justify-center gap-6 px-10 py-6 md:py-8 rounded-[2rem] text-2xl font-[900] uppercase tracking-[0.15em] border transition-all ${isAdminActive ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-600 border-zinc-800'}`}
                >
                  <UserCog className="w-8 h-8" />
                  Panel
                </button>
              </div>
            </div>

            <div className="py-10 flex flex-col items-center gap-2 shrink-0 opacity-10">
                <span className="text-xl font-black italic uppercase tracking-tighter">BLACKSHEEP</span>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16 relative z-10">
        {children}
      </main>

      <footer className="border-t border-zinc-900 bg-black py-16 mt-32">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2 opacity-20 grayscale hover:opacity-100 transition-opacity cursor-default">
            <span className="text-2xl font-black italic tracking-tighter uppercase">BLACK</span>
            <span className="text-2xl font-black italic tracking-tighter uppercase text-red-600">SHEEP</span>
          </div>
          <p className="text-zinc-800 text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] px-4">Global Elite Standard © 2025</p>
        </div>
      </footer>
    </div>
  );
};
