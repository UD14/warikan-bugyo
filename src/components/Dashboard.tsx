import React from 'react';
import { Plus, Trash2, CheckCircle, Clock, ChevronRight, Coins } from 'lucide-react';
import { generateId } from '../utils/uuid';
import { calculateSettlement } from '../utils/calculate';
import type { AppState, Event, CalculationResult } from '../types';

interface DashboardProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
  onOpenGlobalSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, dispatch }) => {
  const handleCreateEvent = () => {
    const newEvent: Event = {
      id: generateId(),
      name: '新しい飲み会',
      phases: [],
      participants: [
        {
          id: generateId(),
          name: '自分（幹事）',
          hasPaid: true,
          adjustments: {}
        }
      ],
      roundingUnit: 10,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_EVENT', payload: newEvent });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">飲み会一覧</h2>
          <p className="text-xs font-bold text-gray-400 mt-1">過去の精算履歴を管理・保存できます</p>
        </div>
      </div>

      <div className="grid gap-4">
        <button
          onClick={handleCreateEvent}
          className="group relative bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-teal-400 hover:bg-teal-50/30 transition-all active:scale-[0.98]"
        >
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={24} strokeWidth={3} />
          </div>
          <span className="text-sm font-black text-gray-500 group-hover:text-teal-700">新しい飲み会を作成</span>
        </button>

        {state.events.length === 0 ? (
          <div className="text-center py-12">
            <Coins className="mx-auto text-gray-200 mb-2" size={48} />
            <p className="text-gray-400 text-sm font-bold">まだデータがありません</p>
          </div>
        ) : (
          state.events.map((event) => {
            const results = calculateSettlement(event);
            const uncollectedAmount = results.filter(r => !r.hasPaid).reduce((sum, r) => sum + r.totalAmount, 0);

            return (
              <div 
                key={event.id}
                className={`group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all ${
                  event.status === 'completed' ? 'opacity-75' : ''
                }`}
              >
                <div className="p-5 flex items-center justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => dispatch({ type: 'SET_ACTIVE_EVENT', payload: event.id })}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`flex items-center text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border ${
                        event.status === 'completed' 
                          ? 'text-emerald-700 bg-emerald-100 border-emerald-200' 
                          : 'text-orange-700 bg-orange-100 border-orange-200'
                      }`}>
                        {event.status === 'completed' ? (
                          <><CheckCircle size={12} className="mr-1" /> 清算済</>
                        ) : (
                          <><Clock size={12} className="mr-1" /> 進行中</>
                        )}
                      </div>
                      <span className="text-xs font-bold text-gray-400 ml-1">{formatDate(event.createdAt)}</span>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2">
                      {event.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-[10px] font-bold text-gray-400 flex items-center">
                        <Plus size={10} className="mr-1" /> {event.participants.length}名参加
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 flex items-center">
                        <Plus size={10} className="mr-1" /> {event.phases.length}店舗
                      </div>
                      {uncollectedAmount > 0 && event.status !== 'completed' && (
                        <div className="text-[10px] font-bold text-orange-600 flex items-center bg-orange-50 px-1.5 py-0.5 rounded">
                          未集金: ¥{uncollectedAmount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (event.status !== 'completed' && uncollectedAmount > 0) {
                          if (!window.confirm(`まだ未集金が ¥${uncollectedAmount.toLocaleString()} あります。精算済みにしますか？`)) {
                            return;
                          }
                        }
                        dispatch({ type: 'TOGGLE_EVENT_COMPLETED', payload: event.id });
                      }}
                      className={`p-2 rounded-xl transition-all ${
                        event.status === 'completed'
                          ? 'text-emerald-600 bg-emerald-50 border-2 border-emerald-100'
                          : 'text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 border-2 border-transparent'
                      }`}
                      title={event.status === 'completed' ? '未完了に戻す' : '清算済みにする'}
                    >
                      <CheckCircle size={22} strokeWidth={3} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('このイベントを削除しますか？')) {
                          dispatch({ type: 'REMOVE_EVENT', payload: event.id });
                        }
                      }}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="削除"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_EVENT', payload: event.id })}
                      className="p-2 text-teal-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                    >
                      <ChevronRight size={20} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
