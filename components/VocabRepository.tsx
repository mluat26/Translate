import React, { useState } from 'react';
import { Search, Filter, Download, Inbox, SortAsc, LayoutGrid, Table as TableIcon, Trash2, X, Eye, EyeOff } from 'lucide-react';
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
      <div className="fixed bottom-[6.5rem] md:bottom-6 left-4 right-4 z-30 animate-in slide-in-from-bottom-10 duration-300 pointer-events-none">
        
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

            {/* Controls Group - Scrollable on very small screens, flex row usually */}
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

                {/* View Toggle */}
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 flex-shrink-0 items-center">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Dạng lưới"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${viewMode === 'table' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Dạng bảng"
                    >
                        <TableIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 flex-shrink-0">
                    {levels.map(lvl => (
                        <button
                            key={lvl}
                            onClick={() => setLevelFilter(lvl)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                                levelFilter === lvl 
                                ? 'bg-blue-50 text-blue-600' 
                                : 'text-slate-400 hover:bg-slate-50'
                            }`}
                        >
                            {lvl === 'ALL' ? 'All' : lvl}
                        </button>
                    ))}
                </div>

                 <button
                    onClick={onExport}
                    disabled={items.length === 0}
                    className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    title="Xuất file Word"
                >
                    <Download className="w-4 h-4" />
                </button>

            </div>
        </div>
      </div>

    </div>
  );
};

export default VocabRepository;