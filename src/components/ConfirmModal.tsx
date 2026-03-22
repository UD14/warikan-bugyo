import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '実行する',
  cancelText = 'キャンセル',
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    warning: {
      icon: <AlertTriangle className="text-orange-500" size={32} />,
      btnClass: 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-100',
      bgClass: 'bg-orange-50'
    },
    danger: {
      icon: <AlertTriangle className="text-red-500" size={32} />,
      btnClass: 'bg-red-500 hover:bg-red-600 text-white shadow-red-100',
      bgClass: 'bg-red-50'
    },
    info: {
      icon: <AlertTriangle className="text-teal-500" size={32} />,
      btnClass: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-100',
      bgClass: 'bg-teal-50'
    }
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        <div className="p-8 pt-10 text-center">
          <div className={`w-16 h-16 ${config.bgClass} rounded-2xl flex items-center justify-center mx-auto mb-6 scale-110`}>
            {config.icon}
          </div>
          
          <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">
            {title}
          </h3>
          
          <p className="text-sm font-bold text-gray-500 leading-relaxed px-2">
            {message}
          </p>
        </div>

        <div className="p-4 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 px-4 bg-white text-gray-400 hover:text-gray-600 font-black text-sm rounded-2xl border border-gray-200 transition-all active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3.5 px-4 ${config.btnClass} font-black text-sm rounded-2xl shadow-lg transition-all active:scale-95`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
