import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  items?: string[];
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, onClose, onConfirm, title, message, items 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center p-0 md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Activity View */}
      <div className="relative bg-white w-full max-w-md rounded-t-[2rem] md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 md:zoom-in-95 pb-6 md:pb-0">
        
         {/* Handle Bar */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden" onClick={onClose}>
            <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        <div className="p-6 pt-2 md:pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-full flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                {message}
              </p>
              
              {items && items.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 max-h-32 overflow-y-auto mb-6">
                  <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                    {items.map((item, idx) => (
                      <li key={idx} className="font-bold">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col-reverse md:flex-row gap-3 md:justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-3 md:py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm w-full md:w-auto"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={onConfirm}
                  className="px-4 py-3 md:py-2 bg-slate-900 text-white font-bold hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-200 transition-all text-sm w-full md:w-auto"
                >
                  Xác nhận thêm
                </button>
              </div>
            </div>
            <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors hidden md:block"
            >
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;