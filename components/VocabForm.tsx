import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Copy, Check, ArrowDown, FileJson, AlertCircle, List, FileType, Wand2, Lightbulb, Loader2 } from 'lucide-react';
import { VocabItem, WordFamilyItem } from '../types';
import { generatePromptForWord, generatePromptForList, generateSuggestionPrompt, parseAIResult, fetchVocabFromGemini } from '../services/geminiService';
import { getRandomWord } from '../utils/suggestionData';

interface VocabFormProps {
  onAdd: (items: Omit<VocabItem, 'id'>[]) => void;
  apiKey: string;
}

type InputMode = 'single' | 'bulk' | 'generator';

const TOPICS = ["Daily Life", "Travel", "Business", "Technology", "Education", "Food", "Health", "Environment", "IELTS", "Slang"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const QUANTITIES = [3, 5, 10, 20];

const VocabForm: React.FC<VocabFormProps> = ({ onAdd, apiKey }) => {
  const [mode, setMode] = useState<InputMode>('single');

  // Input Step - Manual
  const [inputWord, setInputWord] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  
  // Input Step - Generator
  const [topic, setTopic] = useState('Daily Life');
  const [genLevel, setGenLevel] = useState('B1');
  const [quantity, setQuantity] = useState(5);

  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // JSON Step
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Form Data (Single Preview)
  const [finalWord, setFinalWord] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [meaning, setMeaning] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [example, setExample] = useState('');
  const [level, setLevel] = useState('');
  const [wordFamily, setWordFamily] = useState<WordFamilyItem[]>([]);

  // Form Data (Bulk/Gen Preview)
  const [bulkParsedItems, setBulkParsedItems] = useState<Omit<VocabItem, 'id'>[]>([]);

  // Auto generate prompt
  useEffect(() => {
    if (mode === 'single') {
        if (inputWord.trim()) {
            setGeneratedPrompt(generatePromptForWord(inputWord));
        } else {
            setGeneratedPrompt('');
        }
    } else if (mode === 'bulk') {
        const words = bulkInput.split(/\n|,/).map(s => s.trim()).filter(Boolean);
        if (words.length > 0) {
            setGeneratedPrompt(generatePromptForList(words));
        } else {
            setGeneratedPrompt('');
        }
    } else if (mode === 'generator') {
        setGeneratedPrompt(generateSuggestionPrompt(topic, genLevel, quantity));
    }
  }, [inputWord, bulkInput, mode, topic, genLevel, quantity]);

  const handleSuggestWord = () => {
    const word = getRandomWord();
    setInputWord(word);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAutoGenerate = async () => {
      if (!generatedPrompt) return;
      
      setIsLoading(true);
      setJsonError('');
      try {
          const resultText = await fetchVocabFromGemini(apiKey, generatedPrompt);
          setJsonInput(resultText);
          
          // Trigger parsing logic manually
          const event = { target: { value: resultText } } as React.ChangeEvent<HTMLTextAreaElement>;
          handleJsonPaste(event);
      } catch (error) {
          setJsonError("Lỗi kết nối API. Vui lòng kiểm tra Key hoặc thử lại.");
          console.error(error);
      } finally {
          setIsLoading(false);
      }
  };

  const handleJsonPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonInput(val);
    setJsonError('');
    setFinalWord(''); // Reset single preview
    setBulkParsedItems([]); // Reset bulk preview
    setWordFamily([]);

    if (!val.trim()) return;

    try {
      const data = parseAIResult(val);
      
      if (mode === 'single') {
        // Expect object
        if (Array.isArray(data)) {
             if(data.length > 0) {
                 const item = data[0];
                 setFinalWord(item.word);
                 setPhonetic(item.phonetic);
                 setMeaning(item.meaning);
                 setPartOfSpeech(item.partOfSpeech);
                 setExample(item.example);
                 setLevel(item.level);
                 setWordFamily(item.wordFamily || []);
             }
        } else {
             if (data.word) setFinalWord(data.word);
             if (data.phonetic) setPhonetic(data.phonetic);
             if (data.meaning) setMeaning(data.meaning);
             if (data.partOfSpeech) setPartOfSpeech(data.partOfSpeech);
             if (data.example) setExample(data.example);
             if (data.level) setLevel(data.level);
             if (data.wordFamily) setWordFamily(data.wordFamily);
        }
      } else {
          // Bulk & Generator mode: Expect Array
          if (Array.isArray(data)) {
              setBulkParsedItems(data);
          } else {
              setBulkParsedItems([data]);
          }
      }

    } catch (err) {
      if (val.includes('{') || val.includes('[')) {
          setJsonError("Định dạng JSON không hợp lệ.");
      }
    }
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wordToSave = finalWord.trim() || inputWord.trim();
    if (!wordToSave) return;

    onAdd([{
      word: wordToSave,
      phonetic,
      meaning,
      partOfSpeech,
      example,
      level,
      wordFamily
    }]);
    resetForm();
  };

  const handleBulkSubmit = () => {
      if (bulkParsedItems.length === 0) return;
      onAdd(bulkParsedItems);
      resetForm();
  };

  const resetForm = () => {
    setInputWord('');
    setBulkInput('');
    setJsonInput('');
    setFinalWord('');
    setPhonetic('');
    setMeaning('');
    setPartOfSpeech('');
    setExample('');
    setLevel('');
    setWordFamily([]);
    setBulkParsedItems([]);
  };

  const getLevelColor = (lvl: string) => {
    if (!lvl) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (lvl.startsWith('A')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (lvl.startsWith('B')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (lvl.startsWith('C')) return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 mb-10 relative overflow-hidden transition-all duration-300">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Sparkles className="w-5 h-5" />
            </div>
            Thêm từ vựng
          </h2>

          {/* Mode Toggle Pills */}
          <div className="bg-slate-100 p-1 rounded-full flex text-xs font-bold border border-slate-200 overflow-x-auto max-w-full">
             <button
                onClick={() => { setMode('single'); resetForm(); }}
                className={`px-3 sm:px-4 py-1.5 rounded-full transition-all flex items-center gap-2 whitespace-nowrap ${mode === 'single' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
             >
                <FileType className="w-3.5 h-3.5" />
                Một từ
             </button>
             <button
                onClick={() => { setMode('bulk'); resetForm(); }}
                className={`px-3 sm:px-4 py-1.5 rounded-full transition-all flex items-center gap-2 whitespace-nowrap ${mode === 'bulk' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
             >
                <List className="w-3.5 h-3.5" />
                Nhiều từ
             </button>
             <button
                onClick={() => { setMode('generator'); resetForm(); }}
                className={`px-3 sm:px-4 py-1.5 rounded-full transition-all flex items-center gap-2 whitespace-nowrap ${mode === 'generator' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow text-white' : 'text-slate-500 hover:text-slate-800'}`}
             >
                <Lightbulb className="w-3.5 h-3.5" />
                Gợi ý AI
             </button>
          </div>
      </div>
      
      <div className="space-y-6">
        
        {/* Step 1: Input Area (Changes based on Mode) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                        {mode === 'single' ? 'Nhập từ vựng' : mode === 'bulk' ? 'Nhập danh sách từ' : 'Cấu hình gợi ý'}
                    </div>
                    {mode === 'single' && (
                        <button 
                            onClick={handleSuggestWord}
                            className="text-indigo-600 text-xs flex items-center gap-1 hover:underline"
                        >
                            <Wand2 className="w-3 h-3" /> Random
                        </button>
                    )}
                </label>

                {/* --- SINGLE MODE --- */}
                {mode === 'single' && (
                    <div className="relative">
                        <input
                            type="text"
                            value={inputWord}
                            onChange={(e) => setInputWord(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-lg"
                            placeholder="Ví dụ: serendipity"
                        />
                         <button onClick={handleSuggestWord} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1">
                             <Wand2 className="w-4 h-4" />
                         </button>
                    </div>
                )}

                {/* --- BULK MODE --- */}
                {mode === 'bulk' && (
                    <textarea
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                        className="w-full h-[150px] pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                        placeholder="Nhập các từ, mỗi từ một dòng hoặc cách nhau bằng dấu phẩy..."
                    />
                )}

                {/* --- GENERATOR MODE (NEW) --- */}
                {mode === 'generator' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 h-[240px] lg:h-auto overflow-y-auto">
                        
                        {/* Topic Selector */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-2">Chủ đề (Hoặc nhập tự do)</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {TOPICS.slice(0, 6).map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => setTopic(t)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${topic === t ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <input 
                                type="text" 
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                                placeholder="Nhập chủ đề bất kỳ..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Level Selector */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-2">Trình độ</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {LEVELS.map(l => (
                                        <button 
                                            key={l}
                                            onClick={() => setGenLevel(l)}
                                            className={`w-8 h-8 rounded-full text-xs font-bold border transition-all flex items-center justify-center ${genLevel === l ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'}`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quantity Selector */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-2">Số lượng từ</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {QUANTITIES.map(q => (
                                        <button 
                                            key={q}
                                            onClick={() => setQuantity(q)}
                                            className={`px-3 h-8 rounded-full text-xs font-bold border transition-all flex items-center justify-center ${quantity === q ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Prompt Output Area / Action Button */}
            <div className="space-y-2 relative">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                    {apiKey ? 'Tạo nội dung' : 'Copy Prompt này'}
                </label>
                
                {apiKey ? (
                    <div className="flex flex-col gap-3 h-full justify-center">
                        <button
                            onClick={handleAutoGenerate}
                            disabled={!generatedPrompt || isLoading}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang phân tích...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    ✨ Tạo tự động với AI
                                </>
                            )}
                        </button>
                        <p className="text-xs text-center text-slate-400">
                             Sử dụng Prompt bên dưới để gửi yêu cầu đến Gemini
                        </p>
                        {/* Hidden Prompt for debugging or manual backup */}
                        <details className="text-xs text-slate-400 cursor-pointer">
                            <summary>Xem Prompt gốc</summary>
                            <div className="mt-2 relative group">
                                <textarea 
                                    readOnly
                                    value={generatedPrompt}
                                    className="w-full p-2 bg-slate-50 border rounded-lg h-20"
                                />
                                <button
                                    onClick={handleCopyPrompt}
                                    className="absolute right-2 top-2 p-1 bg-white border rounded hover:text-indigo-600"
                                >
                                    <Copy className="w-3 h-3" />
                                </button>
                            </div>
                        </details>
                    </div>
                ) : (
                    <div className="relative group h-full">
                        <textarea 
                            readOnly
                            value={generatedPrompt}
                            className={`w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 resize-none outline-none font-mono ${mode !== 'single' ? 'h-[150px] lg:h-full' : 'h-[54px]'}`}
                            placeholder="Prompt sẽ hiện ở đây..."
                        />
                        <button
                            onClick={handleCopyPrompt}
                            disabled={!generatedPrompt}
                            className="absolute right-2 top-2 p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm z-10"
                            title="Copy Prompt"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Step 3: Paste JSON (Hidden if auto-generated successfully to reduce clutter, or keep for edit) */}
        <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">3</span>
                {apiKey ? 'Kết quả từ AI (Có thể chỉnh sửa)' : `Dán kết quả JSON ${(mode === 'bulk' || mode === 'generator') ? '(Array)' : ''} từ AI`}
             </label>
             <div className="relative">
                <div className="absolute top-3 left-3 text-slate-400">
                    <FileJson className="w-5 h-5" />
                </div>
                <textarea
                    value={jsonInput}
                    onChange={handleJsonPaste}
                    className={`w-full h-24 pl-10 pr-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all font-mono text-sm ${jsonError ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}`}
                    placeholder={mode === 'single' ? 'Ví dụ: { "word": "...", ... }' : 'Ví dụ: [ { "word": "...", ... }, ... ]'}
                />
             </div>
             {jsonError && (
                 <p className="text-red-500 text-xs flex items-center gap-1">
                     <AlertCircle className="w-3 h-3" /> {jsonError}
                 </p>
             )}
        </div>

        {/* Arrow Divider */}
        {(finalWord || bulkParsedItems.length > 0) && (
             <div className="flex justify-center -my-2">
                <div className="bg-slate-100 text-slate-400 p-1 rounded-full animate-bounce">
                    <ArrowDown className="w-4 h-4" />
                </div>
             </div>
        )}

        {/* --- RESULT VIEW: SINGLE MODE --- */}
        {mode === 'single' && (
            <div className={`pt-4 border-t border-slate-100 transition-all duration-500 ${finalWord ? 'opacity-100' : 'opacity-50 grayscale pointer-events-none'}`}>
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Thông tin chi tiết</h3>
                 
                 <form onSubmit={handleSingleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Từ vựng</label>
                            <input
                                type="text"
                                value={finalWord}
                                onChange={(e) => setFinalWord(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-800"
                            />
                        </div>
                        
                        <div className="md:col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">IPA</label>
                            <input
                                type="text"
                                value={phonetic}
                                onChange={(e) => setPhonetic(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-serif"
                            />
                        </div>

                        <div className="md:col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Loại từ</label>
                            <input
                                type="text"
                                value={partOfSpeech}
                                onChange={(e) => setPartOfSpeech(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                            />
                        </div>

                        <div className="md:col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Level</label>
                            <input
                                type="text"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg font-bold text-center ${getLevelColor(level)}`}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                         <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Nghĩa</label>
                            <input
                                type="text"
                                value={meaning}
                                onChange={(e) => setMeaning(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                            />
                        </div>
                        <div className="md:col-span-8">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Ví dụ</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={example}
                                    onChange={(e) => setExample(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg italic text-slate-600 pr-8"
                                />
                                 <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 font-serif font-bold text-xl">"</div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={!finalWord}
                            className="px-8 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 font-medium transition-all shadow-lg shadow-slate-300/50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-5 h-5" />
                            Lưu từ này
                        </button>
                    </div>
                 </form>
            </div>
        )}

        {/* --- RESULT VIEW: BULK & GENERATOR MODE --- */}
        {(mode === 'bulk' || mode === 'generator') && bulkParsedItems.length > 0 && (
            <div className="pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Xem trước ({bulkParsedItems.length} từ)</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                    {bulkParsedItems.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex gap-3 items-start text-sm">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                {idx + 1}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                    <div className="font-bold text-slate-900">{item.word}</div>
                                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getLevelColor(item.level)}`}>{item.level}</div>
                                </div>
                                <div className="text-slate-500 italic font-serif text-xs">{item.phonetic}</div>
                                <div className="text-slate-700 line-clamp-2">{item.meaning}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleBulkSubmit}
                        className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 font-medium transition-all shadow-lg shadow-indigo-300/50 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Lưu toàn bộ {bulkParsedItems.length} từ
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default VocabForm;