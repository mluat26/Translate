import React, { useState } from 'react';
import { Search, Filter, Download, Inbox, SortAsc, LayoutGrid, Table as TableIcon, Trash2, X, Eye, EyeOff, SlidersHorizontal, Check, ArrowDownUp } from 'lucide-react';
import VocabList from './VocabList';
import { VocabItem } from '../types';

interface VocabRepositoryProps {
  items: VocabItem[];
  onDelete: (id: string) => void;
  onExport: () => void;
}

type SortMode = 'newest' | 'oldest' | 'az' | 'za';
type ViewMode = 'grid' | 'table';

const VocabRepository: React.FC<VocabRepositoryProps> = ({ items, onDelete, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showMeaning, setShowMeaning] = useState(true);
  
  // Filter Sheet State
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.topic && item.topic.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLevel = levelFilter === 'ALL' || (item.level && item.level.startsWith(levelFilter));
    
    return matchesSearch && matchesLevel;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
      switch (sortMode) {
          case 'az': return a.word.localeCompare(b.word);
          case 'za': return b.word.localeCompare(a.word);
          case 'oldest': return 0;
          case 'newest': return 0;
          default: return 0;
      }
  });

  if (sortMode === 'oldest') sortedItems.reverse();
  
  const levels = ['ALL', 'A', 'B', 'C'];

  const clearSearch = () => {
    setSearchTerm('');
    setLevelFilter('ALL');
  }

  const activeFiltersCount = (levelFilter !== 'ALL' ? 1 : 0);

  return (
    <div className="relative min-h-screen pb-80"> 
      
      {/* 1. CONTENT AREA (List/Table) */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex items-center justify-between px-2 mb-4 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4" />
                <span>Hiển thị {filteredItems.length} / {items.length} từ</span>
            </div>
             {(searchTerm || levelFilter !== 'ALL') && (
                <button onClick={clearSearch} className="text-blue-600 hover:underline flex items-center gap-1">
                    Xóa bộ lọc <X className="w-3 h-3" />
                </button>
            )}
        </div>

        {viewMode === 'grid' ? (
            <VocabList items={sortedItems} onDelete={onDelete} showMeaning={showMeaning} />
        ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 min-w-[150px]">Từ vựng</th>
                                <th className="px-6 py-4">Loại/Level</th>
                                <th className="px-6 py-4 min-w-[200px]">Nghĩa</th>
                                <th className="px-6 py-4 min-w-[200px]">Ví dụ</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedItems.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 text-base">{item.word}</div>
                                        <div className="text-slate-500 font-serif italic text-xs">{item.phonetic}</div>
                                        {item.topic && <div className="text-[10px] text-blue-500 mt-1">{item.topic}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600">{item.partOfSpeech}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                item.level?.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                                                item.level?.startsWith('B') ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                                {item.level || 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate md:whitespace-normal">
                                        {showMeaning ? (
                                            <div title={item.meaning}>{item.meaning}</div>
                                        ) : (
                                            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 max-w-xs text-slate-500 italic truncate md:whitespace-normal">
                                         {showMeaning ? (
                                            <div title={item.example}>{item.example}</div>
                                        ) : (
                                            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse"></div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onDelete(item.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sortedItems.length === 0 && (
                        <div className="p-12 text-center text-slate-400 text-sm">Chưa có dữ liệu</div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* 2. TOOLBAR - Fixed at Bottom (Above Global Nav) - CLEANER UI */}
      <div className="fixed bottom-[6.5rem] md:bottom-6 left-4 right-4 z-30 animate-in slide-in-from-bottom-10 duration-500 pointer-events-none">
        
        {/* Unified Container */}
        <div className="bg-slate-100/90 backdrop-blur-xl rounded-[2rem] p-3 shadow-2xl shadow-slate-200/50 border border-white/50 max-w-4xl mx-auto pointer-events-auto flex flex-col md:flex-row gap-3 items-center">
            
            {/* Search - Full width on mobile, auto on desktop */}
            <div className="relative w-full md:flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                type="text" 
                placeholder="Tìm từ vựng..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
            </div>

            {/* Controls Group */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide justify-between md:justify-end pb-1 md:pb-0">
                
                {/* Visibility Toggle */}
                <button
                    onClick={() => setShowMeaning(!showMeaning)}
                    className={`p-2.5 rounded-xl border transition-all flex-shrink-0 ${showMeaning ? 'bg-white text-slate-500 border-slate-200 hover:text-blue-600' : 'bg-blue-100 text-blue-600 border-blue-200'}`}
                    title={showMeaning ? "Ẩn nghĩa" : "Hiện nghĩa"}
                >
                    {showMeaning ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                <div className="h-6 w-px bg-slate-300/50 mx-1 flex-shrink-0"></div>

                {/* Filter & Options Trigger (New Activity View Trigger) */}
                <button
                    onClick={() => setShowFilterSheet(true)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all flex-shrink-0 text-sm font-bold ${
                        activeFiltersCount > 0 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline">Hiển thị & Lọc</span>
                    {activeFiltersCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-600 text-[10px] ml-1">{activeFiltersCount}</span>}
                </button>

                 <button
                    onClick={onExport}
                    disabled={items.length === 0}
                    className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    title="Xuất file Word"
                >
                    {/* Use text on mobile if space allows, or just icon */}
                    <span className="hidden sm:inline text-xs font-bold mr-2">Xuất Word</span>
                    {/* Icon only on small screens implicitly by structure */}
                    <Download className="w-4 h-4 inline" />
                </button>

            </div>
        </div>
      </div>

      {/* 3. FILTER & OPTIONS SHEET (Activity View) */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center p-0 md:p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-500"
                onClick={() => setShowFilterSheet(false)}
            ></div>
            
            {/* Sheet */}
            <div className="relative bg-white w-full max-w-sm rounded-t-[2rem] md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:zoom-in-95 pb-8 md:pb-0">
                
                {/* Handle */}
                <div className="w-full flex justify-center pt-3 pb-1 md:hidden" onClick={() => setShowFilterSheet(false)}>
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
                </div>

                <div className="p-6 pt-2 md:pt-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                             <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                             Tùy chọn hiển thị
                        </h3>
                        <button onClick={() => setShowFilterSheet(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        
                        {/* View Mode */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-3 block flex items-center gap-2">
                                <LayoutGrid className="w-3.5 h-3.5" /> Giao diện
                            </label>
                            <div className="bg-slate-100 p-1 rounded-xl flex">
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" /> Lưới
                                </button>
                                <button 
                                    onClick={() => setViewMode('table')}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <TableIcon className="w-4 h-4" /> Bảng
                                </button>
                            </div>
                        </div>

                        {/* Sort */}
                        <div>
                             <label className="text-xs font-bold text-slate-400 uppercase mb-3 block flex items-center gap-2">
                                <ArrowDownUp className="w-3.5 h-3.5" /> Sắp xếp
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'newest', label: 'Mới nhất' },
                                    { id: 'oldest', label: 'Cũ nhất' },
                                    { id: 'az', label: 'A - Z' },
                                    { id: 'za', label: 'Z - A' },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSortMode(opt.id as SortMode)}
                                        className={`py-2.5 px-3 rounded-xl text-sm font-bold border transition-all text-left flex justify-between items-center ${
                                            sortMode === opt.id 
                                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {opt.label}
                                        {sortMode === opt.id && <Check className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Filter Level */}
                         <div>
                             <label className="text-xs font-bold text-slate-400 uppercase mb-3 block flex items-center gap-2">
                                <Filter className="w-3.5 h-3.5" /> Lọc theo Level
                            </label>
                            <div className="flex gap-2">
                                {levels.map(lvl => (
                                    <button
                                        key={lvl}
                                        onClick={() => setLevelFilter(lvl)}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                                            levelFilter === lvl 
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {lvl === 'ALL' ? 'Tất cả' : lvl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowFilterSheet(false)}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all"
                        >
                            Xong
                        </button>

                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default VocabRepository;