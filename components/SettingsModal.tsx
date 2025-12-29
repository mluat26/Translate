import React, { useState, useEffect } from 'react';
import { X, Key, Save, Check, ExternalLink, HardDrive, Zap } from 'lucide-react';
import { getQuotaStats } from '../services/geminiService';
import { StorageStats } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSave: (key: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, apiKey, onSave }) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);
  const [quota, setQuota] = useState({ used: 0, total: 20 });
  const [storage, setStorage] = useState<StorageStats>({ usedBytes: 0, totalBytes: 0, usagePercent: 0 });

  useEffect(() => {
    setInputKey(apiKey);
    if (isOpen) {
        setQuota(getQuotaStats());
        checkStorage();
    }
  }, [apiKey, isOpen]);

  const checkStorage = async () => {
      if (navigator.storage && navigator.storage.estimate) {
          try {
              const estimate = await navigator.storage.estimate();
              const used = estimate.usage || 0;
              const total = estimate.quota || 1024 * 1024 * 1024; // fallback to 1GB
              setStorage({
                  usedBytes: used,
                  totalBytes: total,
                  usagePercent: (used / total) * 100
              });
          } catch (e) {
              console.error("Storage estimate failed", e);
          }
      }
  };

  const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSave = () => {
    onSave(inputKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center p-0 md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Activity View / Bottom Sheet */}
      <div className="relative bg-white w-full max-w-md rounded-t-[2rem] md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 md:zoom-in-95 pb-6 md:pb-0">
        
        {/* Handle Bar for Mobile Look */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden" onClick={onClose}>
            <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        <div className="p-6 pt-2 md:pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Key className="w-6 h-6 text-blue-600" />
              Cài đặt & Thống kê
            </h3>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors hidden md:block">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Quota Section */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 uppercase">
                        <Zap className="w-3.5 h-3.5" /> API Hôm nay
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                        {quota.used} <span className="text-sm font-medium text-slate-400">/ {quota.total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all ${quota.used >= quota.total ? 'bg-red-500' : 'bg-blue-500'}`} 
                            style={{ width: `${(quota.used / quota.total) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 uppercase">
                        <HardDrive className="w-3.5 h-3.5" /> Dung lượng
                    </div>
                    <div className="text-lg font-bold text-slate-800 truncate" title={formatBytes(storage.usedBytes)}>
                        {formatBytes(storage.usedBytes)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        trên {formatBytes(storage.totalBytes)}
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                         <div 
                            className="h-full rounded-full transition-all bg-emerald-500"
                            style={{ width: `${Math.max(1, storage.usagePercent)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs text-blue-800 leading-relaxed font-medium">
                        Key được lưu ở trình duyệt. Sử dụng Google Gemini Flash (Miễn phí).
                    </p>
                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-600 flex items-center gap-1 mt-2 hover:underline"
                    >
                        Lấy API Key tại đây <ExternalLink className="w-3 h-3" />
                    </a>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Gemini API Key</label>
                    <input 
                        type="password" 
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-slate-600"
                        placeholder="AIzaSy..."
                    />
                </div>
            </div>
            
            <div className="pt-2">
              <button
                onClick={handleSave}
                className={`w-full py-4 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${saved ? 'bg-emerald-500 shadow-emerald-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-300'}`}
              >
                {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {saved ? 'Đã lưu cài đặt' : 'Lưu cấu hình'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;