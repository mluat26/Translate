import React, { useState, useEffect } from 'react';
import { Database, Zap } from 'lucide-react';
import { getQuotaStats } from '../services/geminiService';

interface StatsBarProps {
  triggerRefresh: number;
  onOpenStorage?: () => void;
}

const StatsBar: React.FC<StatsBarProps> = ({ triggerRefresh, onOpenStorage }) => {
  const [quota, setQuota] = useState({ used: 0, total: 20 });
  const [storageBytes, setStorageBytes] = useState<number>(0);

  useEffect(() => {
    updateStats();
  }, [triggerRefresh]);

  const updateStats = async () => {
    setQuota(getQuotaStats());
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        setStorageBytes(estimate.usage || 0);
      } catch (error) {
        console.error("Storage estimate error:", error);
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

  const quotaColor = quota.used >= quota.total ? 'text-red-600' : 'text-blue-600';
  const progressPercent = Math.min(100, (quota.used / quota.total) * 100);

  return (
    <div className="flex bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-full px-4 py-1.5 items-center gap-4 transition-all hover:shadow-md hover:scale-[1.02]">
      
      {/* API Quota Section */}
      <div className="flex items-center gap-2" title="Số request AI hôm nay">
        <div className={`p-1 rounded-full ${quota.used >= quota.total ? 'bg-red-100' : 'bg-blue-100'}`}>
           <Zap className={`w-3.5 h-3.5 ${quotaColor}`} />
        </div>
        <div className="flex flex-col justify-center h-full">
            <span className="text-[10px] font-bold text-slate-400 leading-none mb-0.5 uppercase tracking-wider">API Limit</span>
            <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${quotaColor}`}>{quota.used}/{quota.total}</span>
                <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${quota.used >= quota.total ? 'bg-red-500' : 'bg-blue-500'} transition-all duration-500`} style={{ width: `${progressPercent}%` }}></div>
                </div>
            </div>
        </div>
      </div>

      <div className="w-px h-6 bg-slate-200"></div>

      {/* Storage Section - Clickable */}
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-slate-100/50 rounded-lg pr-2 -mr-2 transition-colors" 
        title="Nhấn để quản lý bộ nhớ"
        onClick={onOpenStorage}
      >
        <div className="p-1 rounded-full bg-emerald-100">
           <Database className="w-3.5 h-3.5 text-emerald-600" />
        </div>
         <div className="flex flex-col justify-center h-full">
            <span className="text-[10px] font-bold text-slate-400 leading-none mb-0.5 uppercase tracking-wider">Storage</span>
            <span className="text-xs font-bold text-slate-700">{formatBytes(storageBytes)}</span>
        </div>
      </div>

    </div>
  );
};

export default StatsBar;