import { useState, useRef, useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import { Dashboard } from './components/Dashboard';
import { EventTab } from './components/EventTab';
import { SettlementTab } from './components/SettlementTab';
import { SettingsPanel } from './components/SettingsPanel';
import { HelpModal } from './components/HelpModal';
import { ClipboardList, CheckSquare, Pencil, Coins, ChevronLeft } from 'lucide-react';

function App() {
  const { state, activeEvent, results, dispatch } = useAppState();
  const [activeTab, setActiveTab] = useState<'input' | 'settlement'>('input');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const spanRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState(0);

  useEffect(() => {
    if (spanRef.current && activeEvent) {
      setInputWidth(spanRef.current.offsetWidth + 4);
    }
  }, [activeEvent?.name]);

  const handleBackToDashboard = () => {
    dispatch({ type: 'SET_ACTIVE_EVENT', payload: null });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-32 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        {/* ブランディングバー */}
        <div className="bg-indigo-950 text-white py-1.5 px-4 shadow-sm">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <Coins size={14} className="text-amber-400 mr-2" />
              <h1 className="text-[10px] font-black tracking-widest uppercase opacity-80">わりかん奉行</h1>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-4">
          {!activeEvent ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-900 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                  <Coins className="text-white" size={28} strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">わりかん奉行</h1>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">爆速精算システム</p>
                  </div>
                  <button 
                    onClick={() => setShowHelp(true)}
                    className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all border border-gray-100 mt-1"
                    title="使い方・説明"
                  >
                    <span className="text-xs font-black">?</span>
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-gray-100"
                title="設定"
              >
                <ClipboardList size={24} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleBackToDashboard}
                    className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <ChevronLeft size={24} strokeWidth={3} />
                  </button>
                  <div className="relative flex items-center group">
                    <span 
                      ref={spanRef}
                      className="invisible absolute whitespace-pre text-2xl font-black p-0"
                    >
                      {activeEvent.name || 'イベント名'}
                    </span>
                    <input
                      type="text"
                      className="text-lg md:text-2xl font-black border-none bg-transparent focus:ring-0 p-0 text-left placeholder-gray-300"
                      style={{ width: inputWidth ? `${inputWidth + 12}px` : 'auto', minWidth: '4ch' }}
                      value={activeEvent.name}
                      onChange={(e) => dispatch({ type: 'UPDATE_EVENT_NAME', payload: e.target.value })}
                      placeholder="イベント名"
                    />
                    <Pencil 
                      size={18} 
                      className="text-gray-300 ml-2 cursor-pointer flex-shrink-0 hover:text-indigo-600 transition-colors" 
                      onClick={(e) => {
                        const input = (e.currentTarget.previousSibling as HTMLInputElement);
                        input?.focus();
                      }}
                    />
                    <button 
                      onClick={() => setShowHelp(true)}
                      className="w-5 h-5 ml-2 flex items-center justify-center text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all border border-gray-100"
                      title="使い方・説明"
                    >
                      <span className="text-[10px] font-black">?</span>
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-gray-100"
                  title="設定"
                >
                  <ClipboardList size={22} />
                </button>
              </div>

              <nav className="border-b border-gray-100 flex -mb-4">
                <button
                  onClick={() => setActiveTab('input')}
                  className={`flex items-center py-3 px-6 border-b-2 transition-all ${
                    activeTab === 'input' 
                      ? 'border-indigo-600 text-indigo-700' 
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <ClipboardList size={18} className="mr-2" />
                  <span className="text-sm font-bold">1. 入力</span>
                </button>
                <button
                  onClick={() => setActiveTab('settlement')}
                  className={`flex items-center py-3 px-6 border-b-2 transition-all ${
                    activeTab === 'settlement' 
                      ? 'border-indigo-600 text-indigo-700' 
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <CheckSquare size={18} className="mr-2" />
                  <span className="text-sm font-bold">2. 精算</span>
                </button>
              </nav>
            </>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 w-full">
        {activeEvent ? (
          <>
            {activeTab === 'input' && <EventTab event={activeEvent} allEvents={state.events} dispatch={dispatch} />}
            {activeTab === 'settlement' && (
              <SettlementTab 
                event={activeEvent} 
                dispatch={dispatch} 
                results={results}
                userConfig={state.userConfig}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            )}
          </>
        ) : (
          <Dashboard 
            state={state} 
            dispatch={dispatch} 
            onOpenGlobalSettings={() => setIsSettingsOpen(true)} 
          />
        )}
      </main>

      {/* 下部ナビゲーション */}
      {activeEvent && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl shadow-2xl p-1.5 flex gap-1 z-40">
          <button 
            onClick={() => setActiveTab('input')}
            className={`flex items-center px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-black transition-all ${
              activeTab === 'input' 
                ? 'bg-indigo-900 text-white shadow-lg shadow-indigo-200 scale-105' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="mr-1 md:mr-2">1.</span>
            <Pencil size={14} className="md:size-[16px] mr-1 md:mr-1.5" /> 入力
          </button>
          <button 
            onClick={() => setActiveTab('settlement')}
            className={`flex items-center px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-black transition-all ${
              activeTab === 'settlement' 
                ? 'bg-indigo-900 text-white shadow-lg shadow-indigo-200 scale-105' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="mr-1 md:mr-2">2.</span>
            <CheckSquare size={14} className="md:size-[16px] mr-1 md:mr-1.5" /> 精算
          </button>
        </div>
      )}

      {isSettingsOpen && (
        <SettingsPanel 
          userConfig={state.userConfig} 
          dispatch={dispatch} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

export default App;
