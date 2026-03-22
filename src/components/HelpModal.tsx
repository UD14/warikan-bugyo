import React from 'react';
import { X, Zap, Users, ShieldCheck, History, Edit3 } from 'lucide-react';

type Props = {
  onClose: () => void;
};

export const HelpModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <header className="bg-teal-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={24} className="fill-white" />
            <h2 className="text-xl font-black tracking-tight">「割り勘の相棒」とは？</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-8 text-left">
          <section>
            <h3 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
              <Zap size={20} className="text-orange-500" />
              コンセプト：爆速精算
            </h3>
            <p className="text-sm font-bold text-gray-600 leading-relaxed">
              飲み会が終わったその瞬間に、1秒でも早く精算報告を終わらせるためのツールです。
              めんどくさい計算はすべて自動。コピーしてLINEに貼るだけで完了します。
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <Users size={20} className="text-teal-600 mb-2" />
              <h4 className="font-black text-gray-900 text-sm mb-1">高度な傾斜計算</h4>
              <p className="text-[11px] font-bold text-gray-500 leading-normal">
                「多め」「少なめ」だけでなく、独自の倍率設定も可能。2軒目からの参加・中抜きも自由自在です。
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <Edit3 size={20} className="text-teal-600 mb-2" />
              <h4 className="font-black text-gray-900 text-sm mb-1">直感的な編集</h4>
              <p className="text-[11px] font-bold text-gray-500 leading-normal">
                参加者の名前や金額、お店の名前などは、画面上の文字を直接クリックするだけで編集できます。
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <History size={20} className="text-teal-600 mb-2" />
              <h4 className="font-black text-gray-900 text-sm mb-1">履歴・コピー機能</h4>
              <p className="text-[11px] font-bold text-gray-500 leading-normal">
                過去の飲み会データは自動保存。いつものメンバーなら「コピー」機能で一瞬で構成を復元できます。
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <ShieldCheck size={20} className="text-teal-600 mb-2" />
              <h4 className="font-black text-gray-900 text-sm mb-1">プライバシー重視</h4>
              <p className="text-[11px] font-bold text-gray-500 leading-normal">
                データはあなたのブラウザ（LocalStorage）にのみ保存されます。サーバーには送信されません。
              </p>
            </div>
          </div>

          <section className="pt-4 border-t border-gray-100">
            <div className="bg-teal-50 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 bg-teal-100 rounded-xl text-teal-600 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="font-black text-teal-900 text-sm mb-1">使いこなしのコツ</h4>
                <p className="text-[11px] font-bold text-teal-700 leading-relaxed">
                  右上の「設定」からPayPay IDや銀行口座を登録しておくと、生成されるメッセージに自動で振込先が記載されます。テンプレートの編集もここで行えます。
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
          <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-black text-sm hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
          >
            わかった！
          </button>
        </footer>
      </div>
    </div>
  );
};
