import React, { useState, useMemo } from 'react';
import { X, Trash2, Database, Search, CheckSquare, Square, HardDrive } from 'lucide-react';
import { VocabItem } from '../types';

interface StorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: VocabItem[];
  onDeleteItems: (ids: string[]) => void;
}

const StorageManagerModal: React.FC<StorageManagerModalProps> = ({ isOpen, onClose, items, onDeleteItems }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate approximate size (UTF-16 = 2 bytes per char)
  const getItemSize = (item: VocabItem) => {
      const str = JSON.stringify(item);
      return str.length * 2;
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => 
        item.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (item.topic && item.topic.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [items, searchTerm]);

  const totalSize = useMemo(() => {
      return items.reduce((acc, item) => acc + getItemSize(item), 0);
  }, [items]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSelectAll = () => {
      if (selectedIds.size === filteredItems.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(filteredItems.map(i => i.id)));
      }
  };

  const toggleSelect = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedIds(newSet);
  };

  const handleDelete = () => {
      if (confirm(`Bạn có chắc muốn xóa ${selectedIds.size} từ đã chọn? Hành động này không thể hoàn tác.`)) {
          onDeleteItems(Array.from(selectedIds));
          setSelectedIds(new Set());
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center p-0 md:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 animate-in fade-in" onClick={onClose}></div>
      
      {/* Activity View - Full Height on Mobile */}
      <div className="relative bg-white w-full max-w-6xl h-[92vh] md:h-[90vh] flex flex-col rounded-t-[2rem] md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
        
        {/* Handle Bar */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden bg-white flex-shrink-0" onClick={onClose}>
            <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
            <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Database className="w-6 h-6 text-indigo-600" />
                    Quản lý bộ nhớ
                </h3>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                    <HardDrive className="w-3.5 h-3.5" />
                    Đang sử dụng khoảng <span className="font-bold text-slate-800">{formatBytes(totalSize)}</span> cho {items.length} từ vựng.
                </p>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors hidden md:block">
                <X className="w-6 h-6 text-slate-500" />
            </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center flex-shrink-0">
            <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm từ để xóa..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <div className="text-xs text-slate-500 font-medium">
                    Đã chọn: <span className="text-indigo-600 font-bold">{selectedIds.size}</span>
                </div>
                <button 
                    onClick={handleDelete}
                    disabled={selectedIds.size === 0}
                    className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-colors shadow-sm shadow-red-200"
                >
                    <Trash2 className="w-4 h-4" />
                    Xóa đã chọn
                </button>
            </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto bg-slate-50/50 pb-8 md:pb-0">
            <table className="w-full text-left border-collapse">
                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="p-4 w-12 border-b border-slate-200">
                            <button onClick={handleSelectAll} className="flex items-center justify-center text-slate-400 hover:text-indigo-600">
                                {selectedIds.size > 0 && selectedIds.size === filteredItems.length ? 
                                    <CheckSquare className="w-5 h-5 text-indigo-600" /> : 
                                    <Square className="w-5 h-5" />
                                }
                            </button>
                        </th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">Từ vựng</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 hidden sm:table-cell">Chủ đề</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 hidden md:table-cell">Nghĩa</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 text-right">Kích thước</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredItems.map(item => {
                        const isSelected = selectedIds.has(item.id);
                        return (
                            <tr 
                                key={item.id} 
                                className={`hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/50' : ''}`}
                                onClick={() => toggleSelect(item.id)}
                            >
                                <td className="p-4">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                        {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-slate-800">{item.word}</div>
                                    <div className="text-xs text-slate-500 font-mono">{item.phonetic}</div>
                                </td>
                                <td className="p-4 hidden sm:table-cell">
                                    {item.topic ? <span className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600">{item.topic}</span> : <span className="text-slate-400 text-xs italic">--</span>}
                                </td>
                                <td className="p-4 hidden md:table-cell">
                                    <div className="text-sm text-slate-600 truncate max-w-xs" title={item.meaning}>{item.meaning}</div>
                                </td>
                                <td className="p-4 text-right">
                                    <span className="text-xs font-mono text-slate-400">{formatBytes(getItemSize(item))}</span>
                                </td>
                            </tr>
                        )
                    })}
                    {filteredItems.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-12 text-center text-slate-400">
                                Không tìm thấy từ nào.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default StorageManagerModal;