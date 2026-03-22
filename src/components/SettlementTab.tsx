import React, { useState } from 'react';
import type { Event, CalculationResult, UserConfig } from '../types';
import { CheckCircle2, Circle, RotateCcw, Copy, Check, MessageCircle, Settings } from 'lucide-react';
import { generateAllMessage, generateRemindMessage } from '../utils/message';

type Props = {
  event: Event;
  dispatch: React.Dispatch<any>;
  results: CalculationResult[];
  userConfig: UserConfig;
  onOpenSettings: () => void;
};

export const SettlementTab: React.FC<Props> = ({ event, dispatch, results, userConfig, onOpenSettings }) => {
  const [copiedType, setCopiedType] = useState<'all' | 'remind' | null>(null);
  const [displayMode, setDisplayMode] = useState<'amount' | 'person'>('amount');
  const [customAllMessage, setCustomAllMessage] = useState<string | null>(null);
  const [customRemindMessage, setCustomRemindMessage] = useState<string | null>(null);

  const handleCopy = (text: string, type: 'all' | 'remind') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    });
  };

  const togglePaid = (participantId: string, currentStatus: boolean) => {
    const participant = event.participants.find(p => p.id === participantId);
    if (participant) {
      dispatch({ 
        type: 'UPDATE_PARTICIPANT', 
        payload: { ...participant, hasPaid: !currentStatus } 
      });
    }
  };

  const totalAmount = results.reduce((sum, r) => sum + r.totalAmount, 0);
  const collectedAmount = results.filter(r => r.hasPaid).reduce((sum, r) => sum + r.totalAmount, 0);
  const remainingAmount = totalAmount - collectedAmount;
  const isComplete = totalAmount > 0 && remainingAmount === 0;

  if (results.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500">参加者がいないか、お店の情報がありません</p>
      </div>
    );
  }

  const allMessage = generateAllMessage(event, results, userConfig.paymentInfo, displayMode, userConfig.messageTemplates);
  const remindMessage = generateRemindMessage(event, results, userConfig.paymentInfo, displayMode, userConfig.messageTemplates);

  const currentAllMessage = customAllMessage ?? allMessage;
  const currentRemindMessage = customRemindMessage ?? remindMessage;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* サマリーカード */}
      <section className={`rounded-xl shadow-sm border p-6 text-center ${isComplete ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
        {isComplete ? (
          <div className="flex flex-col items-center justify-center animate-in zoom-in">
            <CheckCircle2 size={48} className="text-green-500 mb-3" />
            <h2 className="text-xl font-bold text-green-700 mb-1">集金完了！</h2>
            <p className="text-green-600 font-medium">お疲れ様でした！</p>
          </div>
        ) : (
          <div className="flex justify-between items-center text-left">
            <div>
              <p className="text-[10px] md:text-sm font-black text-gray-400 uppercase tracking-widest mb-0.5">総額</p>
              <p className="text-xl md:text-3xl font-black text-gray-900">¥{totalAmount.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] md:text-sm font-black text-gray-400 uppercase tracking-widest mb-0.5">未集金</p>
              <p className="text-xl md:text-3xl font-black text-red-500">¥{remainingAmount.toLocaleString()}</p>
            </div>
          </div>
        )}
        
        {!isComplete && (
          <div className="mt-4 pt-4 border-t border-gray-100/50">
            <div className="w-full bg-gray-100 rounded-full h-3 mb-1 overflow-hidden">
              <div 
                className="bg-teal-600 h-3 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs font-bold text-gray-400">
              <span>集金済: ¥{collectedAmount.toLocaleString()}</span>
              <span>{Math.floor(totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0)}%</span>
            </div>
          </div>
        )}
      </section>

      {/* 個別精算リスト */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left">
        <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">個別精算額</h3>
        </div>
        
        <div className="divide-y divide-gray-100">
          {results.map((result, index) => (
            <div 
              key={result.participantId} 
              className={`flex items-center justify-between px-5 py-4 transition-colors ${result.hasPaid ? 'bg-green-50/30' : 'hover:bg-gray-50'}`}
            >
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className="font-bold text-gray-800 text-lg">{result.name}</span>
                  {index === 0 && (
                    <span className="ml-2 text-[10px] font-black bg-teal-900 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">
                      幹事
                    </span>
                  )}
                </div>
                <span className="text-2xl font-black mt-1 text-gray-900 select-all">
                  ¥{result.totalAmount.toLocaleString()}
                </span>
              </div>
              
              <button 
                onClick={() => togglePaid(result.participantId, result.hasPaid)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                  result.hasPaid 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-600' 
                    : 'border-gray-200 bg-white text-gray-400 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600'
                }`}
              >
                {result.hasPaid ? (
                  <>
                    <CheckCircle2 size={28} className="mb-1" />
                    <span className="text-[10px] font-black uppercase">支払済</span>
                  </>
                ) : (
                  <>
                    <Circle size={28} className="mb-1" />
                    <span className="text-[10px] font-black uppercase">未払い</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* メッセージ生成 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center">
            <MessageCircle size={16} className="text-gray-500 mr-1.5 hidden sm:block" />
            <h2 className="font-bold text-gray-800 text-sm">メッセージ案内</h2>
            <button
              onClick={onOpenSettings}
              className="ml-2 p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors flex items-center"
              title="設定"
            >
              <Settings size={14} />
            </button>
          </div>
          <button
            onClick={() => handleCopy(currentAllMessage, 'all')}
            className={`flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95 shrink-0 ${
              copiedType === 'all' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-teal-900 text-white hover:bg-teal-950 shadow-sm'
            }`}
          >
            {copiedType === 'all' ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
            {copiedType === 'all' ? '完了' : 'コピー'}
          </button>
        </div>
        <div className="p-4 pb-0 flex items-center justify-between">
          <div className="flex p-0.5 bg-gray-100 rounded-md w-fit">
            <button
              onClick={() => {
                setDisplayMode('amount');
                setCustomAllMessage(null);
              }}
              className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${
                displayMode === 'amount' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              円単位
            </button>
            <button
              onClick={() => {
                setDisplayMode('person');
                setCustomAllMessage(null);
              }}
              className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${
                displayMode === 'person' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              人単位
            </button>
          </div>
          
          <button
            onClick={() => setCustomAllMessage(null)}
            className="text-[10px] font-black text-teal-600 hover:text-teal-700 flex items-center gap-1 bg-teal-50 px-2 py-1.5 rounded-md transition-colors"
          >
            <RotateCcw size={12} />
            テンプレを反映
          </button>
        </div>
        <div className="p-0">
          <textarea 
            className="w-full h-40 p-4 text-sm font-mono text-gray-700 bg-transparent border-none resize-none focus:ring-0"
            value={currentAllMessage}
            onChange={(e) => setCustomAllMessage(e.target.value)}
          />
        </div>
      </section>

      {results.some(r => !r.hasPaid) && (
        <section className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden text-left mb-8">
          <div className="bg-red-50/50 px-4 py-3 border-b border-red-100 flex items-center justify-between gap-2">
            <h2 className="font-bold text-red-700 text-sm">未払い者向けリマインド</h2>
            <button
              onClick={() => handleCopy(currentRemindMessage, 'remind')}
              className={`flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95 shrink-0 ${
                copiedType === 'remind' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
              }`}
            >
              {copiedType === 'remind' ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
              {copiedType === 'remind' ? '完了' : 'コピー'}
            </button>
          </div>
          <div className="px-4 pt-3 flex justify-end">
            <button
              onClick={() => setCustomRemindMessage(null)}
              className="text-[10px] font-black text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 px-2 py-1.5 rounded-md transition-colors"
            >
              <RotateCcw size={12} />
              テンプレを反映
            </button>
          </div>
          <div className="p-0">
            <textarea 
              className="w-full h-32 p-5 text-sm font-mono text-gray-700 bg-transparent border-none resize-none focus:ring-0"
              value={currentRemindMessage}
              onChange={(e) => setCustomRemindMessage(e.target.value)}
            />
          </div>
        </section>
      )}

    </div>
  );
};
