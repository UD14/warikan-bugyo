import React, { useState } from 'react';
import { X, Building, Wallet, Edit3 } from 'lucide-react';
import type { UserConfig, MessageTemplates, PaymentInfo, BankAccount } from '../types';
import { defaultTemplates } from '../utils/message';
import { generateId } from '../utils/uuid';

type Props = {
  userConfig: UserConfig;
  dispatch: React.Dispatch<any>;
  onClose: () => void;
};

export const SettingsPanel: React.FC<Props> = ({ userConfig, dispatch, onClose }) => {
  const [activeTab, setActiveTab] = useState<'payment' | 'template'>('payment');
  const [lastFocusedTextarea, setLastFocusedTextarea] = useState<'all' | 'remind'>('all');

  // 編集用の補助関数
  const updateConfig = (updates: Partial<UserConfig>) => {
    dispatch({ type: 'UPDATE_USER_CONFIG', payload: { ...userConfig, ...updates } });
  };

  const updatePaymentInfo = (updates: Partial<PaymentInfo>) => {
    updateConfig({
      paymentInfo: {
        ...userConfig.paymentInfo,
        ...updates
      }
    });
  };

  const updateBankAccount = (id: string, updates: Partial<BankAccount>) => {
    updatePaymentInfo({
      bankAccounts: userConfig.paymentInfo.bankAccounts.map(a => a.id === id ? { ...a, ...updates } : a)
    });
  };

  const addBankAccount = () => {
    updatePaymentInfo({
      bankAccounts: [
        ...userConfig.paymentInfo.bankAccounts,
        { id: generateId(), bankName: '', branchName: '', accountType: '普通', accountNumber: '', accountHolder: '' }
      ]
    });
  };

  const removeBankAccount = (id: string) => {
    updatePaymentInfo({
      bankAccounts: userConfig.paymentInfo.bankAccounts.filter(a => a.id !== id)
    });
  };

  const updateTemplate = (key: keyof MessageTemplates, value: string) => {
    updateConfig({
      messageTemplates: {
        ...(userConfig.messageTemplates || { all: '', remind: '' }),
        [key]: value
      }
    });
  };

  const insertTag = (tag: string) => {
    const currentVal = userConfig.messageTemplates?.[lastFocusedTextarea] || '';
    updateTemplate(lastFocusedTextarea, currentVal + tag);
  };

  const resetTemplates = () => {
    updateConfig({
      messageTemplates: {
        all: defaultTemplates.all,
        remind: defaultTemplates.remind
      }
    });
  };

  const tags = [
    { label: '飲み会名', value: '{{飲み会名}}' },
    { label: '内訳', value: '{{内訳}}' },
    { label: '支払い金額', value: '{{支払い金額}}' },
    { label: '支払い先', value: '{{支払い先}}' },
  ];

  const bankAccounts = userConfig.paymentInfo.bankAccounts;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-0 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md h-full sm:h-[90vh] bg-white sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-right sm:zoom-in-95 duration-300 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">設定</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Application Settings</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </header>

        <nav className="flex px-6 border-b border-gray-100 shrink-0">
          <button 
            onClick={() => setActiveTab('payment')}
            className={`py-3 px-4 text-xs font-black transition-all border-b-2 ${activeTab === 'payment' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}
          >
            振込先情報
          </button>
          <button 
            onClick={() => setActiveTab('template')}
            className={`py-3 px-4 text-xs font-black transition-all border-b-2 ${activeTab === 'template' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}
          >
            メッセージテンプレート
          </button>
        </nav>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {activeTab === 'payment' ? (
            <div className="space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Building size={16} />
                  </div>
                  <h3 className="font-black text-gray-900 text-sm">銀行口座・PayPay ID</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">PayPay ID / 電話番号</label>
                    <input 
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-bold transition-all outline-none"
                      placeholder="例：paypay_id"
                      value={userConfig.paymentInfo.paypayId}
                      onChange={e => updatePaymentInfo({ paypayId: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    {bankAccounts.map((account, index) => (
                      <div key={account.id} className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl relative group">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">銀行口座 {index + 1}</h4>
                          {bankAccounts.length > 1 && (
                            <button 
                              onClick={() => removeBankAccount(account.id)}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="削除"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">銀行名</label>
                              <input 
                                className="w-full px-3 py-2 bg-white border border-gray-100 focus:border-indigo-500 rounded-lg text-xs font-bold transition-all outline-none"
                                placeholder="楽天銀行"
                                value={account.bankName}
                                onChange={e => updateBankAccount(account.id, { bankName: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">支店名</label>
                              <input 
                                className="w-full px-3 py-2 bg-white border border-gray-100 focus:border-indigo-500 rounded-lg text-xs font-bold transition-all outline-none"
                                placeholder="第一営業"
                                value={account.branchName}
                                onChange={e => updateBankAccount(account.id, { branchName: e.target.value })}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-1">
                              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">種別</label>
                              <select 
                                className="w-full px-2 py-2 bg-white border border-gray-100 focus:border-indigo-500 rounded-lg text-xs font-bold transition-all outline-none appearance-none cursor-pointer"
                                value={account.accountType}
                                onChange={e => updateBankAccount(account.id, { accountType: e.target.value as '普通' | '当座' })}
                              >
                                <option value="普通">普通</option>
                                <option value="当座">当座</option>
                              </select>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">口座番号</label>
                              <input 
                                className="w-full px-3 py-2 bg-white border border-gray-100 focus:border-indigo-500 rounded-lg text-xs font-bold transition-all outline-none"
                                placeholder="1234567"
                                value={account.accountNumber}
                                onChange={e => updateBankAccount(account.id, { accountNumber: e.target.value })}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">口座名義 (カタカナ)</label>
                            <input 
                              className="w-full px-3 py-2 bg-white border border-gray-100 focus:border-indigo-500 rounded-lg text-xs font-bold transition-all outline-none"
                              placeholder="タナカ タロウ"
                              value={account.accountHolder}
                              onChange={e => updateBankAccount(account.id, { accountHolder: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={addBankAccount}
                    className="w-full py-3 mt-4 border-2 border-dashed border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
                  >
                    + 銀行口座を追加
                  </button>
                </div>
              </section>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl shrink-0 h-fit">
                  <Wallet size={16} />
                </div>
                <p className="text-[11px] font-bold text-amber-700 leading-normal">
                  ここで設定した情報は、精算メッセージの最後に自動的に追加されます。相手がコピーしやすい形式で入力しましょう。
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Edit3 size={16} />
                  </div>
                  <h3 className="font-black text-gray-900 text-sm">テンプレート編集</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">全員向け精算案内</label>
                    <textarea 
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold transition-all outline-none min-h-[140px] leading-relaxed"
                      value={userConfig.messageTemplates?.all}
                      onChange={e => updateTemplate('all', e.target.value)}
                      onFocus={() => setLastFocusedTextarea('all')}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">催促（リマインド）メッセージ</label>
                    <textarea 
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold transition-all outline-none min-h-[100px] leading-relaxed"
                      value={userConfig.messageTemplates?.remind}
                      onChange={e => updateTemplate('remind', e.target.value)}
                      onFocus={() => setLastFocusedTextarea('remind')}
                    />
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={resetTemplates}
                      className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2"
                    >
                      初期テンプレートに戻す
                    </button>
                  </div>
                </div>

                <div className="mt-8 p-5 bg-indigo-900 rounded-2xl shadow-xl shadow-indigo-100 overflow-hidden relative group">
                  <div className="relative z-10">
                    <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                       利用可能なタグ
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <button 
                          key={tag.value}
                          onClick={() => insertTag(tag.value)}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[11px] font-black text-white transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <span className="opacity-50 text-[14px] leading-none">+</span>
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* 装飾用 */}
                  <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-indigo-800 rounded-full blur-3xl opacity-50 group-hover:bg-indigo-700 transition-colors" />
                </div>
              </section>
            </div>
          )}
        </div>

        <footer className="p-6 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-gray-800 transition-all active:scale-[0.98] shadow-xl"
          >
            設定を保存して閉じる
          </button>
        </footer>
      </div>
    </div>
  );
};
