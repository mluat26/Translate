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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-full flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                {message}
              </p>
              
              {items && items.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 max-h-32 overflow-y-auto mb-4">
                  <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                    {items.map((item, idx) => (
                      <li key={idx} className="font-medium">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={onConfirm}
                  className="px-4 py-2 bg-slate-900 text-white font-medium hover:bg-slate-800 rounded-lg shadow-lg shadow-slate-200 transition-all text-sm"
                >
                  Xác nhận thêm
                </button>
              </div>
            </div>
            <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
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