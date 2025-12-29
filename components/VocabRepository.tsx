import React, { useState } from 'react';
import { Search, Filter, Download, Inbox, SortAsc, SortDesc, Calendar } from 'lucide-react';
import VocabList from './VocabList';
import { VocabItem } from '../types';

interface VocabRepositoryProps {
  items: VocabItem[];
  onDelete: (id: string) => void;
  onExport: () => void;
}

type SortMode = 'newest' | 'oldest' | 'az' | 'za';

const VocabRepository: React.FC<VocabRepositoryProps> = ({ items, onDelete, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  // Filter
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === 'ALL' || (item.level && item.level.startsWith(levelFilter));
    
    return matchesSearch && matchesLevel;
  });

  // Sort
  const sortedItems = [...filteredItems].sort((a, b) => {
      switch (sortMode) {
          case 'az': return a.word.localeCompare(b.word);
          case 'za': return b.word.localeCompare(a.word);
          case 'oldest': return 0; // Assuming initial order is oldest first if not reversing
          case 'newest': return 0; // Handled by reversing logic or assumption that App.tsx adds to top? 
          // App.tsx adds to top, so items[0] is newest. 
          // Default order of vocabList is Newest -> Oldest.
          default: return 0;
      }
  });

  // Since default vocabList is Newest first:
  // If user wants oldest, we reverse. 
  // If 'az'/'za', we already sorted.
  if (sortMode === 'oldest') sortedItems.reverse();
  
  const levels = ['ALL', 'A', 'B', 'C'];

  return (
    <div className="space-y-6">
      {/* Modern Glass Toolbar */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-slate-200 sticky top-20 z-30 transition-all">
        
        {/* Top Row: Search & Action */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                type="text" 
                placeholder="Tìm kiếm từ, nghĩa, ví dụ..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
            </div>
             <button
                onClick={onExport}
                disabled={items.length === 0}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-slate-300/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none whitespace-nowrap"
            >
                <Download className="w-4 h-4" />
                <span>Xuất ra Word</span>
            </button>
        </div>

        {/* Bottom Row: Filters & Sort */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4">
            
            {/* Level Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide">
                <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1 flex-shrink-0">
                    <Filter className="w-3 h-3" /> Lọc:
                </span>
                {levels.map(lvl => (
                    <button
                        key={lvl}
                        onClick={() => setLevelFilter(lvl)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                            levelFilter === lvl 
                            ? 'bg-indigo-100 text-indigo-700 shadow-sm ring-1 ring-indigo-200' 
                            : 'bg-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        {lvl === 'ALL' ? 'Tất cả' : `Trình độ ${lvl}`}
                    </button>
                ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs font-semibold text-slate-400 hidden sm:inline flex-shrink-0">Sắp xếp:</span>
                <div className="relative group w-full sm:w-auto">
                    <select
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value as SortMode)}
                        className="appearance-none w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-1.5 pl-3 pr-8 rounded-lg cursor-pointer focus:outline-none hover:bg-slate-100 transition-colors"
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="az">A - Z</option>
                        <option value="za">Z - A</option>
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        {sortMode === 'az' || sortMode === 'za' ? <SortAsc className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* Stats Line */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            <span>Hiển thị {filteredItems.length} từ</span>
        </div>
        {searchTerm && <span>Kết quả tìm kiếm cho "{searchTerm}"</span>}
      </div>

      {/* List */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <VocabList items={sortedItems} onDelete={onDelete} />
      </div>
    </div>
  );
};

export default VocabRepository;