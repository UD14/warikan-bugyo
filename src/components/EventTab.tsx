import type { Event, Phase, Participant } from '../types';
import { Plus, Trash2, Users, Receipt, Pencil, Copy } from 'lucide-react';
import { generateId } from '../utils/uuid';

type Props = {
  event: Event;
  allEvents: Event[];
  dispatch: React.Dispatch<any>;
};

export const EventTab: React.FC<Props> = ({ event, allEvents, dispatch }) => {
  const [isAddingParticipant, setIsAddingParticipant] = React.useState(false);
  const [newParticipantName, setNewParticipantName] = React.useState('');
  const [editingParticipantId, setEditingParticipantId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const participantInputRef = React.useRef<HTMLInputElement>(null);
  const editInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isAddingParticipant && participantInputRef.current) {
      participantInputRef.current.focus();
    }
  }, [isAddingParticipant]);

  React.useEffect(() => {
    if (editingParticipantId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingParticipantId]);

  const handleAddPhase = () => {
    const newPhase: Phase = {
      id: crypto.randomUUID(),
      name: `新しいお店`,
      totalAmount: 0,
      participantIds: event.participants.map(p => p.id) // デフォルトで全員参加
    };
    dispatch({ type: 'ADD_PHASE', payload: newPhase });
  };

  const handleUpdatePhase = (phaseId: string, updates: Partial<Phase>) => {
    const phase = event.phases.find(p => p.id === phaseId);
    if (!phase) return;
    dispatch({ type: 'UPDATE_PHASE', payload: { ...phase, ...updates } });
  };

  const handleRemovePhase = (phaseId: string) => {
    dispatch({ type: 'REMOVE_PHASE', payload: phaseId });
  };

  const submitAddParticipant = () => {
    const name = newParticipantName.trim();
    if (!name) {
      setIsAddingParticipant(false);
      return;
    }

    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name,
      adjustments: {},
      hasPaid: false
    };
    dispatch({ type: 'ADD_PARTICIPANT', payload: newParticipant });
    
    // 既存のすべてのフェーズに新メンバーを追加
    event.phases.forEach(phase => {
      handleUpdatePhase(phase.id, { participantIds: [...phase.participantIds, newParticipant.id] });
    });

    setNewParticipantName('');
    setIsAddingParticipant(false);
  };

  const startEditingParticipant = (p: Participant) => {
    setEditingParticipantId(p.id);
    setEditingName(p.name);
  };

  const submitEditParticipant = () => {
    if (!editingParticipantId) return;
    const name = editingName.trim();
    if (!name) {
      setEditingParticipantId(null);
      return;
    }

    const participant = event.participants.find(p => p.id === editingParticipantId);
    if (participant) {
      dispatch({ 
        type: 'UPDATE_PARTICIPANT', 
        payload: { ...participant, name } 
      });
    }
    setEditingParticipantId(null);
  };

  const handleRemoveParticipant = (id: string) => {
    if (window.confirm("この参加者を削除してよろしいですか？")) {
      dispatch({ type: 'REMOVE_PARTICIPANT', payload: id });
    }
  };

  const togglePhaseParticipation = (phaseId: string, participantId: string) => {
    const phase = event.phases.find(p => p.id === phaseId);
    if (!phase) return;

    const isParticipating = phase.participantIds.includes(participantId);
    const newIds = isParticipating 
      ? phase.participantIds.filter(id => id !== participantId)
      : [...phase.participantIds, participantId];
      
    handleUpdatePhase(phaseId, { participantIds: newIds });
  };

  const updateAdjustment = (participant: Participant, phaseId: string, type: 'multiplier' | 'fixed_offset', valueStr: string) => {
    const value = parseFloat(valueStr) || 0;
    const newParticipant = {
      ...participant,
      adjustments: {
        ...participant.adjustments,
        [phaseId]: { type, value }
      }
    };
    dispatch({ type: 'UPDATE_PARTICIPANT', payload: newParticipant });
  };

  const [customModePhases, setCustomModePhases] = React.useState<Set<string>>(new Set());

  const toggleCustomMode = (phaseId: string) => {
    setCustomModePhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 過去の飲み会からコピー */}
      {allEvents && allEvents.length > 1 && (
        <section className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-indigo-700">
              <Copy size={18} className="mr-2" />
              <span className="text-sm font-bold">過去の飲み会をコピーして作成</span>
            </div>
            <select 
              className="text-sm font-bold bg-white border border-indigo-200 text-indigo-700 rounded-lg py-1.5 pl-3 pr-8 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-sm transition-all hover:border-indigo-300"
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (id) {
                  if (window.confirm('現在の入力内容はすべて上書きされます。\n過去の飲み会の構成をコピーしますか？')) {
                    dispatch({ type: 'COPY_FROM_EVENT', payload: id });
                  }
                }
              }}
            >
              <option value="" disabled>飲み会を選択...</option>
              {allEvents.filter(e => e.id !== event.id).map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        </section>
      )}

      {/* 参加者管理 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center text-gray-800">
            <Users className="mr-2 text-indigo-500" size={20} />
            参加者 ({event.participants.length}名)
          </h2>
          {!isAddingParticipant && (
            <button 
              onClick={() => setIsAddingParticipant(true)}
              className="flex items-center text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors"
            >
              <Plus size={16} className="mr-1" /> 追加
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {event.participants.map(p => (
            <div key={p.id} className="flex items-center bg-gray-50 border border-gray-200 rounded-full pl-3 pr-1 py-1 group transition-all hover:border-indigo-300">
              {editingParticipantId === p.id ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitEditParticipant();
                    if (e.key === 'Escape') setEditingParticipantId(null);
                  }}
                  onBlur={submitEditParticipant}
                  className="text-sm font-bold bg-transparent border-none focus:ring-0 p-0 w-24"
                />
              ) : (
                <span 
                  className="text-sm font-bold mr-1 text-gray-700 cursor-pointer flex items-center"
                  onClick={() => startEditingParticipant(p)}
                >
                  {p.name}
                  <Pencil size={12} className="ml-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              )}
              <button 
                onClick={() => handleRemoveParticipant(p.id)}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {isAddingParticipant && (
            <div className="flex items-center bg-white border-2 border-indigo-300 rounded-full pl-3 pr-1 py-0.5 animate-in zoom-in duration-200">
              <input
                ref={participantInputRef}
                type="text"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitAddParticipant();
                  if (e.key === 'Escape') setIsAddingParticipant(false);
                }}
                onBlur={submitAddParticipant}
                placeholder="例：田中, 佐藤, 鈴木（カンマ/改行可）"
                className="text-sm font-bold bg-transparent border-none focus:ring-0 p-0 w-24"
              />
              <button 
                onClick={submitAddParticipant}
                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          )}

          {event.participants.length === 0 && !isAddingParticipant && (
            <div className="w-full text-center py-4 text-gray-400 text-sm">
              まずは参加者を追加してください
            </div>
          )}
        </div>
      </section>

      {/* フェーズ管理 */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center text-gray-800">
            <Receipt className="mr-2 text-indigo-500" size={20} />
            お店・金額
          </h2>
          <button 
            onClick={handleAddPhase}
            className="flex items-center text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 mb-1 shadow-md transition-all active:scale-95"
          >
            <Plus size={16} className="mr-1" /> お店を追加
          </button>
        </div>

        {event.phases.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <Receipt className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-gray-500 font-medium">右上からお店を追加してください</p>
          </div>
        )}

        <div className="space-y-6">
          {event.phases.map((phase, index) => {
            const isCustomMode = customModePhases.has(phase.id);
            return (
              <div key={phase.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden text-left animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-gray-50/50 border-b border-gray-100 px-5 py-4 flex justify-between items-start">
                  <div className="w-full">
                    <div className="flex items-center mb-2">
                      <span className="text-[10px] font-black text-white bg-indigo-900 px-2 py-0.5 rounded mr-2 tracking-widest uppercase">
                        {index + 1}軒目
                      </span>
                      <button 
                        onClick={() => handleRemovePhase(phase.id)}
                        className="ml-auto text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={phase.name}
                      onChange={(e) => handleUpdatePhase(phase.id, { name: e.target.value })}
                      className="text-lg font-black text-gray-900 border-none focus:ring-0 w-full bg-transparent px-0 py-0 placeholder-gray-300"
                      placeholder="例：鳥貴族（一次会）"
                    />
                    <div className="mt-3 relative flex items-center">
                      <span className="text-2xl font-black text-gray-400 mr-1 select-none">¥</span>
                      <input
                        type="number"
                        value={phase.totalAmount || ''}
                        onChange={(e) => handleUpdatePhase(phase.id, { totalAmount: parseInt(e.target.value) || 0 })}
                        className="text-4xl font-black w-full bg-transparent border-none focus:ring-0 p-0 placeholder-gray-100 placeholder:font-black tracking-tight"
                        placeholder="4500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-gray-900 tracking-tight flex items-center">
                      <Users size={14} className="mr-1.5 text-indigo-400" />
                      参加者と傾斜
                    </h3>
                    <button
                      onClick={() => toggleCustomMode(phase.id)}
                      className={`text-[10px] font-black px-2 py-1 rounded transition-colors ${
                        isCustomMode 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {isCustomMode ? 'カスタム解除' : '詳細設定'}
                    </button>
                  </div>
                  
                  {event.participants.length === 0 ? (
                    <p className="text-xs font-bold text-gray-400 py-2">参加者がいません</p>
                  ) : (
                    <div className="space-y-3">
                      {event.participants.map(p => {
                        const isParticipating = phase.participantIds.includes(p.id);
                        const adj = p.adjustments[phase.id] || { type: 'multiplier', value: 1.0 };
                        
                        return (
                          <div key={p.id} className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${isParticipating ? 'bg-indigo-50/30' : 'opacity-30 grayscale'}`}>
                            <div className="flex items-center flex-1 mr-4">
                              <input
                                type="checkbox"
                                checked={isParticipating}
                                onChange={() => togglePhaseParticipation(phase.id, p.id)}
                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded-md focus:ring-indigo-500 transition-all cursor-pointer"
                                id={`check-${phase.id}-${p.id}`}
                              />
                              <label htmlFor={`check-${phase.id}-${p.id}`} className="ml-3 text-sm font-black text-gray-800 select-none cursor-pointer">
                                {p.name}
                              </label>
                            </div>
                            
                            {isParticipating && (
                              <div className="flex items-center">
                                {isCustomMode ? (
                                  <div className="flex items-center bg-white border border-indigo-100 rounded-lg overflow-hidden shadow-sm">
                                    <div className="bg-indigo-50 px-2 py-1 border-r border-indigo-100 flex items-center justify-center">
                                      <span className="text-[10px] font-black text-indigo-600">x</span>
                                    </div>
                                    <input 
                                      type="number"
                                      value={adj.value}
                                      step="0.1"
                                      onChange={(e) => updateAdjustment(p, phase.id, 'multiplier', e.target.value)}
                                      className="w-14 text-center text-xs font-black border-none focus:ring-0 py-1"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex gap-1">
                                    {[
                                      { label: '少', value: 0.5 },
                                      { label: '並', value: 1.0 },
                                      { label: '多', value: 1.5 },
                                    ].map(preset => (
                                      <button
                                        key={preset.label}
                                        onClick={() => updateAdjustment(p, phase.id, 'multiplier', String(preset.value))}
                                        className={`w-9 h-7 text-[10px] font-black rounded-lg transition-all ${
                                          adj.value === preset.value
                                            ? 'bg-indigo-600 text-white shadow-sm scale-105'
                                            : 'bg-white border border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-600'
                                        }`}
                                      >
                                        {preset.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-3">端数処理（切り上げ）</h2>
        <div className="flex space-x-2">
          {[10, 50, 100].map(unit => (
            <button
              key={unit}
              onClick={() => dispatch({ type: 'UPDATE_ROUNDING_UNIT', payload: unit as any })}
              className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                event.roundingUnit === unit 
                  ? 'bg-primary-50 border-primary-200 text-primary-700' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {unit}円単位
            </button>
          ))}
        </div>
      </section>

    </div>
  );
};
