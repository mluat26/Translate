import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Copy, Check, ArrowDown, FileJson, AlertCircle, List, FileType, Wand2, Lightbulb, Loader2, ExternalLink } from 'lucide-react';
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
  const [customTopic, setCustomTopic] = useState('General'); 
  
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

  useEffect(() => {
    if (mode === 'single') {
        setCustomTopic('General');
        if (inputWord.trim()) {
            setGeneratedPrompt(generatePromptForWord(inputWord));
        } else {
            setGeneratedPrompt('');
        }
    } else if (mode === 'bulk') {
        setCustomTopic('General');
        const words = bulkInput.split(/\n|,/).map(s => s.trim()).filter(Boolean);
        if (words.length > 0) {
            setGeneratedPrompt(generatePromptForList(words));
        } else {
            setGeneratedPrompt('');
        }
    } else if (mode === 'generator') {
        setCustomTopic(topic);
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

  const openExternalAI = (service: 'chatgpt' | 'gemini') => {
      handleCopyPrompt();
      const encoded = encodeURIComponent(generatedPrompt);
      if (service === 'chatgpt') {
          window.open(`https://chatgpt.com/?q=${encoded}`, '_blank');
      } else {
          window.open(`https://gemini.google.com/app?text=${encoded}`, '_blank');
      }
  };

  const handleAutoGenerate = async () => {
      if (!generatedPrompt) return;
      setIsLoading(true);
      setJsonError('');
      try {
          const resultText = await fetchVocabFromGemini(apiKey, generatedPrompt);
          setJsonInput(resultText);
          const event = { target: { value: resultText } } as React.ChangeEvent<HTMLTextAreaElement>;
          handleJsonPaste(event);
      } catch (error: any) {
          setJsonError(error.message || "Lỗi kết nối API.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleJsonPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonInput(val);
    setJsonError('');
    setFinalWord(''); 
    setBulkParsedItems([]); 
    setWordFamily([]);

    if (!val.trim()) return;

    try {
      const data = parseAIResult(val);
      if (mode === 'single') {
        const item = Array.isArray(data) ? data[0] : data;
        if (item) {
            setFinalWord(item.word);
            setPhonetic(item.phonetic);
            setMeaning(item.meaning);
            setPartOfSpeech(item.partOfSpeech);
            setExample(item.example);
            setLevel(item.level);
            setWordFamily(item.wordFamily || []);
        }
      } else {
          const items = Array.isArray(data) ? data : [data];
          const itemsWithTopic = items.map((it: any) => ({
              ...it,
              topic: mode === 'generator' ? topic : customTopic
          }));
          setBulkParsedItems(itemsWithTopic);
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
      wordFamily,
      topic: customTopic,
      confidence: 0,
      lastReviewed: new Date().toISOString()
    }]);
    resetForm();
  };

  const handleBulkSubmit = () => {
      if (bulkParsedItems.length === 0) return;
      const finalItems = bulkParsedItems.map(item => ({
          ...item,
          topic: item.topic || customTopic,
          confidence: 0,
          lastReviewed: new Date().toISOString()
      }));
      onAdd(finalItems);
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
    <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] border border-blue-50 mb-10 relative transition-all duration-300">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl text-sm font-bold border border-slate-200 overflow-x-auto max-w-full scrollbar-hide">
             <button onClick={() => { setMode('single'); resetForm(); }} className={`px-4 sm:px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${mode === 'single' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                <FileType className="w-4 h-4" /> Một từ
             </button>
             <button onClick={() => { setMode('bulk'); resetForm(); }} className={`px-4 sm:px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${mode === 'bulk' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                <List className="w-4 h-4" /> Nhiều từ
             </button>
             <button onClick={() => { setMode('generator'); resetForm(); }} className={`px-4 sm:px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${mode === 'generator' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-md text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                <Lightbulb className="w-4 h-4" /> Gợi ý AI
             </button>
          </div>
      </div>
      
      <div className="space-y-8">
        
        {/* Step 1: Input Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
                <label className="text-base font-bold text-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="bg-slate-900 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">1</span>
                        {mode === 'single' ? 'Nhập từ vựng' : mode === 'bulk' ? 'Nhập danh sách từ' : 'Cấu hình gợi ý'}
                    </div>
                    {mode === 'single' && (
                        <button onClick={handleSuggestWord} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline bg-blue-50 px-3 py-1 rounded-full">
                            <Wand2 className="w-3 h-3" /> Random
                        </button>
                    )}
                </label>

                {mode === 'single' && (
                    <div className="space-y-3">
                        <div className="relative">
                            <input type="text" value={inputWord} onChange={(e) => setInputWord(e.target.value)} className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-xl text-slate-800 placeholder:text-slate-300" placeholder="Ví dụ: serendipity" />
                            <button onClick={handleSuggestWord} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-white rounded-full"><Wand2 className="w-5 h-5" /></button>
                        </div>
                        <input type="text" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" placeholder="Chủ đề/Folder (VD: Ielts...)" />
                    </div>
                )}

                {mode === 'bulk' && (
                    <div className="space-y-3">
                        <textarea value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} className="w-full h-[160px] px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-base" placeholder="Nhập các từ, cách nhau bởi dấu phẩy hoặc xuống dòng..." />
                        <input type="text" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" placeholder="Chủ đề/Folder chung" />
                    </div>
                )}

                {mode === 'generator' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5 h-auto">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Chủ đề (Folder)</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {TOPICS.slice(0, 6).map(t => (
                                    <button key={t} onClick={() => setTopic(t)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${topic === t ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>{t}</button>
                                ))}
                            </div>
                            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" placeholder="Nhập chủ đề bất kỳ..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Trình độ</label>
                                <div className="flex flex-wrap gap-2">
                                    {LEVELS.map(l => ( <button key={l} onClick={() => setGenLevel(l)} className={`w-9 h-9 rounded-lg text-xs font-bold border transition-all flex items-center justify-center ${genLevel === l ? 'bg-cyan-100 text-cyan-700 border-cyan-200' : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300'}`}>{l}</button> ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Số lượng</label>
                                <div className="flex flex-wrap gap-2">
                                    {QUANTITIES.map(q => ( <button key={q} onClick={() => setQuantity(q)} className={`px-3 h-9 rounded-lg text-xs font-bold border transition-all flex items-center justify-center ${quantity === q ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>{q}</button> ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Prompt Output Area */}
            <div className="space-y-3 relative flex flex-col">
                <label className="text-base font-bold text-slate-700 flex items-center gap-3">
                    <span className="bg-slate-900 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">2</span>
                    {apiKey ? 'Tạo nội dung' : 'Copy Prompt & Mở AI'}
                </label>
                
                {apiKey ? (
                    <div className="flex flex-col gap-4 h-full justify-center">
                        <button
                            onClick={handleAutoGenerate}
                            disabled={!generatedPrompt || isLoading}
                            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
                        >
                            {isLoading ? <><Loader2 className="w-6 h-6 animate-spin" /> Đang phân tích...</> : <><Sparkles className="w-6 h-6" /> Tạo tự động với AI</>}
                        </button>
                        <p className="text-sm text-center text-slate-400 font-medium">Sử dụng Prompt bên dưới để gửi yêu cầu đến Gemini</p>
                        <details className="text-xs text-slate-400 cursor-pointer group">
                            <summary className="hover:text-blue-600 transition-colors">Xem Prompt gốc</summary>
                            <div className="mt-3 relative">
                                <textarea readOnly value={generatedPrompt} className="w-full p-3 bg-slate-50 border rounded-xl h-24 text-slate-600"/>
                                <button onClick={handleCopyPrompt} className="absolute right-2 top-2 p-2 bg-white border rounded-lg hover:text-blue-600 shadow-sm"><Copy className="w-3.5 h-3.5" /></button>
                            </div>
                        </details>
                    </div>
                ) : (
                    <div className="flex flex-col h-full gap-3">
                         <div className="relative group flex-1 min-h-[120px]">
                            <textarea readOnly value={generatedPrompt} className="w-full h-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 resize-none outline-none font-mono" placeholder="Prompt sẽ hiện ở đây..." />
                            <button onClick={handleCopyPrompt} disabled={!generatedPrompt} className="absolute right-3 top-3 p-2 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm z-10">
                                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => openExternalAI('chatgpt')} className="flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"><ExternalLink className="w-4 h-4" /> ChatGPT</button>
                             <button onClick={() => openExternalAI('gemini')} className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"><ExternalLink className="w-4 h-4" /> Gemini</button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Step 3: Paste JSON */}
        {(jsonInput || !apiKey) && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <label className="text-base font-bold text-slate-700 flex items-center gap-3">
                    <span className="bg-slate-900 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">3</span>
                    {apiKey ? 'Kết quả từ AI' : `Dán kết quả JSON`}
                </label>
                <div className="relative">
                    <div className="absolute top-4 left-4 text-slate-400">
                        <FileJson className="w-6 h-6" />
                    </div>
                    <textarea value={jsonInput} onChange={handleJsonPaste} className={`w-full h-32 pl-14 pr-5 py-4 bg-slate-50 border rounded-2xl outline-none transition-all font-mono text-sm ${jsonError ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'}`} placeholder="JSON Output..." />
                </div>
                {jsonError && ( <p className="text-red-500 text-sm font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {jsonError}</p> )}
            </div>
        )}

        {(finalWord || bulkParsedItems.length > 0) && (
             <div className="flex justify-center -my-2">
                <div className="bg-blue-50 text-blue-400 p-2 rounded-full animate-bounce"><ArrowDown className="w-5 h-5" /></div>
             </div>
        )}

        {/* --- RESULT VIEW: SINGLE MODE --- */}
        {mode === 'single' && finalWord && (
            <div className="pt-6 border-t border-slate-100 animate-in fade-in">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Thông tin chi tiết</h3>
                 <form onSubmit={handleSingleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Từ vựng</label>
                            <input type="text" value={finalWord} onChange={(e) => setFinalWord(e.target.value)} className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-800" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">IPA</label>
                            <input type="text" value={phonetic} onChange={(e) => setPhonetic(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-serif" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Loại từ</label>
                            <input type="text" value={partOfSpeech} onChange={(e) => setPartOfSpeech(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Level</label>
                            <input type="text" value={level} onChange={(e) => setLevel(e.target.value)} className={`w-full px-4 py-3 border rounded-xl font-bold text-center ${getLevelColor(level)}`} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                         <div className="md:col-span-4">
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Nghĩa</label>
                            <input type="text" value={meaning} onChange={(e) => setMeaning(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl" />
                        </div>
                        <div className="md:col-span-8">
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Ví dụ</label>
                            <input type="text" value={example} onChange={(e) => setExample(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl italic text-slate-600" />
                        </div>
                    </div>
                    
                    {/* FIXED BOTTOM ACTION BAR */}
                    <div className="fixed bottom-24 md:bottom-8 left-0 right-0 px-4 md:px-0 z-30 flex justify-center pointer-events-none">
                        <button type="submit" disabled={!finalWord} className="pointer-events-auto w-full md:w-auto max-w-lg py-4 px-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-bold text-lg flex items-center justify-center gap-2 shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-[1.02] transition-all active:scale-95 border-4 border-white">
                            <Plus className="w-6 h-6" strokeWidth={2.5} /> Lưu từ này ngay
                        </button>
                    </div>
                 </form>
            </div>
        )}

        {/* --- RESULT VIEW: BULK & GENERATOR MODE --- */}
        {(mode === 'bulk' || mode === 'generator') && bulkParsedItems.length > 0 && (
            <div className="pt-6 border-t border-slate-100 animate-in fade-in">
                <div className="flex items-center justify-between mb-6">
                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Xem trước ({bulkParsedItems.length} từ)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                    {bulkParsedItems.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex gap-4 items-start text-sm group hover:border-blue-300 transition-colors">
                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 text-xs font-bold group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors shadow-sm">
                                {idx + 1}
                            </div>
                            <div className="flex-1 space-y-1.5 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div className="font-bold text-slate-900 text-base truncate">{item.word}</div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        {item.topic && <span className="text-[10px] bg-slate-200 px-2 py-1 rounded-md text-slate-600 hidden sm:inline-block font-bold">{item.topic}</span>}
                                        <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${getLevelColor(item.level)}`}>{item.level}</div>
                                    </div>
                                </div>
                                <div className="text-slate-500 italic font-serif text-xs">{item.phonetic}</div>
                                <div className="text-slate-700 line-clamp-2 leading-relaxed">{item.meaning}</div>
                            </div>
                        </div>
                    ))}
                </div>

                 {/* FIXED BOTTOM ACTION BAR */}
                 <div className="fixed bottom-24 md:bottom-8 left-0 right-0 px-4 md:px-0 z-30 flex justify-center pointer-events-none">
                    <button onClick={handleBulkSubmit} className="pointer-events-auto w-full md:w-auto max-w-lg py-4 px-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-bold text-lg flex items-center justify-center gap-2 shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-[1.02] transition-all active:scale-95 border-4 border-white">
                        <Plus className="w-6 h-6" strokeWidth={2.5} /> Lưu toàn bộ
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default VocabForm;