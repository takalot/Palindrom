import React, { useState, useCallback, useMemo } from 'react';
import { Search, Sparkles, BookOpen, Trash2, Info, MapPin, Loader2 } from 'lucide-react';
import { findPalindromes, PalindromeResult } from './utils/hebrew';
import { GeminiService } from './services/geminiService';

interface ExtendedResult extends PalindromeResult {
  source?: {
    book: string;
    chapter: string;
    verse: string;
  };
  isCheckingSource?: boolean;
}

interface AIDiscovery {
  text: string;
  book: string;
  chapter: string;
  verse: string;
  meaning?: string;
}

type TabType = 'search' | 'discover';

const App: React.FC = () => {
  // State Management
  const [inputText, setInputText] = useState<string>('');
  const [results, setResults] = useState<ExtendedResult[]>([]);
  const [aiDiscoveries, setAiDiscoveries] = useState<AIDiscovery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [error, setError] = useState<string>('');

  // Gemini Service Instance
  const gemini = useMemo(() => new GeminiService(), []);

  /**
   * חיפוש מקומי של פלינדרומים
   */
  const handleSearch = useCallback(() => {
    if (!inputText.trim()) {
      setError('אנא הזן טקסט לחיפוש');
      return;
    }

    setError('');
    const found = findPalindromes(inputText, 3, 50);
    
    const extendedResults: ExtendedResult[] = found.map(f => ({
      ...f,
      isCheckingSource: false
    }));

    setResults(extendedResults);
    setActiveTab('search');
  }, [inputText]);

  /**
   * גילוי פלינדרומים באמצעות AI
   */
  const handleAIDiscover = useCallback(async () => {
    if (!gemini.isConfigured()) {
      setError('נדרש מפתח API של Gemini. אנא הגדר את VITE_GEMINI_API_KEY');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await gemini.discoverPalindromes(inputText || undefined);
      setAiDiscoveries(data.palindromes);
      setActiveTab('discover');
    } catch (err) {
      console.error('AI Discovery Error:', err);
      setError('שגיאה בתקשורת עם ה-AI. נסה שוב מאוחר יותר.');
    } finally {
      setIsLoading(false);
    }
  }, [gemini, inputText]);

  /**
   * זיהוי מקור בתנ"ך לפלינדרום ספציפי
   */
  const lookupSource = useCallback(async (index: number) => {
    const result = results[index];
    if (!result || result.source || result.isCheckingSource) return;

    // עדכון מצב "בודק"
    const updatingResults = [...results];
    updatingResults[index].isCheckingSource = true;
    setResults(updatingResults);

    try {
      const sourceData = await gemini.identifySource(result.original);
      
      const finalResults = [...results];
      finalResults[index].isCheckingSource = false;

      if (sourceData.found) {
        finalResults[index].source = {
          book: sourceData.book,
          chapter: sourceData.chapter,
          verse: sourceData.verse
        };
      } else {
        setError('לא נמצא מקור מקראי מדויק לרצף זה.');
      }

      setResults(finalResults);
    } catch (err) {
      console.error('Source Lookup Error:', err);
      
      const errorResults = [...results];
      errorResults[index].isCheckingSource = false;
      setResults(errorResults);
      
      setError('שגיאה בזיהוי המקור.');
    }
  }, [results, gemini]);

  /**
   * ניקוי כל הנתונים
   */
  const clearAll = useCallback(() => {
    setInputText('');
    setResults([]);
    setAiDiscoveries([]);
    setError('');
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center pb-12 bg-stone-50">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="w-full max-w-5xl px-4 mt-[-40px] z-20 flex-1">
        {/* Search Panel */}
        <SearchPanel
          inputText={inputText}
          onInputChange={setInputText}
          onSearch={handleSearch}
          onAIDiscover={handleAIDiscover}
          onClear={clearAll}
          isLoading={isLoading}
        />

        {/* Error Message */}
        {error && <ErrorMessage message={error} onClose={() => setError('')} />}

        {/* Tabs */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchCount={results.length}
          discoverCount={aiDiscoveries.length}
        />

        {/* Results */}
        <div className="min-h-[300px]">
          {activeTab === 'search' ? (
            <SearchResults results={results} onLookupSource={lookupSource} />
          ) : (
            <DiscoveryResults discoveries={aiDiscoveries} />
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

/**
 * קומפוננטת Header
 */
const Header: React.FC = () => (
  <header className="w-full bg-stone-900 text-stone-100 py-10 px-6 shadow-2xl text-center relative overflow-hidden">
    <div className="absolute inset-0 opacity-10 pointer-events-none">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5OTkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAtNi42MjcgNS4zNzMtMTIgMTItMTJzMTIgNS4zNzMgMTIgMTItNS4zNzMgMTItMTIgMTItMTItNS4zNzMtMTItMTJ6TTAgMTRjMC02LjYyNyA1LjM3My0xMiAxMi0xMnMxMiA1LjM3MyAxMiAxMi01LjM3MyAxMi0xMiAxMi0xMi01LjM3My0xMi0xMnoiLz48L2c+PC9nPjwvc3ZnPg==')]"></div>
    </div>
    <div className="relative z-10">
      <h1 className="text-5xl md:text-6xl font-bold tanakh-font mb-4 tracking-tight">
        מגלה רצפי פלינדרום
      </h1>
      <p className="text-stone-400 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
        חיפוש רצפים הנקראים ישר והפוך בתוך פסוקי התנ"ך
      </p>
    </div>
  </header>
);

/**
 * פאנל חיפוש
 */
interface SearchPanelProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onSearch: () => void;
  onAIDiscover: () => void;
  onClear: () => void;
  isLoading: boolean;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  inputText,
  onInputChange,
  onSearch,
  onAIDiscover,
  onClear,
  isLoading
}) => (
  <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-6 md:p-8 mb-8 transition-all hover:shadow-2xl">
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-stone-700 font-bold flex items-center gap-2">
          <BookOpen size={20} className="text-amber-700" />
          הכנס טקסט לניתוח
        </label>
        <button
          onClick={onClear}
          className="text-stone-400 hover:text-red-500 transition-colors p-1"
          title="נקה הכל"
          aria-label="נקה הכל"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <textarea
        className="w-full h-40 p-4 border-2 border-stone-100 rounded-xl bg-stone-50 focus:bg-white focus:border-amber-600 focus:outline-none transition-all text-xl tanakh-font resize-none leading-relaxed"
        placeholder="לדוגמה: הבן נאבנאליך כי לא ידע כי כלתו היא..."
        value={inputText}
        onChange={(e) => onInputChange(e.target.value)}
        aria-label="תיבת טקסט לחיפוש"
      />

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onSearch}
          className="flex-1 min-w-[150px] bg-stone-800 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-stone-700 active:scale-95 transition-all shadow-md"
          aria-label="חפש רצפים מקומיים"
        >
          <Search size={22} />
          חפש רצפים מקומיים
        </button>

        <button
          onClick={onAIDiscover}
          disabled={isLoading}
          className="flex-1 min-w-[150px] bg-amber-600 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-500 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="גילוי פלינדרומים בתנ&quot;ך באמצעות AI"
        >
          {isLoading ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <Sparkles size={22} />
          )}
          גילוי פלינדרומים בתנ"ך (AI)
        </button>
      </div>
    </div>
  </div>
);

/**
 * הודעת שגיאה
 */
interface ErrorMessageProps {
  message: string;
  onClose: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClose }) => (
  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between">
    <p className="text-red-700">{message}</p>
    <button
      onClick={onClose}
      className="text-red-400 hover:text-red-600"
      aria-label="סגור הודעה"
    >
      ✕
    </button>
  </div>
);

/**
 * ניווט בין טאבים
 */
interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  searchCount: number;
  discoverCount: number;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  searchCount,
  discoverCount
}) => (
  <div className="flex gap-4 mb-6 border-b border-stone-200">
    <button
      onClick={() => onTabChange('search')}
      className={`pb-3 px-4 font-bold transition-all ${
        activeTab === 'search'
          ? 'border-b-4 border-amber-600 text-amber-900'
          : 'text-stone-400 hover:text-stone-600'
      }`}
      aria-label="תוצאות חיפוש"
    >
      תוצאות חיפוש ({searchCount})
    </button>
    <button
      onClick={() => onTabChange('discover')}
      className={`pb-3 px-4 font-bold transition-all ${
        activeTab === 'discover'
          ? 'border-b-4 border-amber-600 text-amber-900'
          : 'text-stone-400 hover:text-stone-600'
      }`}
      aria-label="תגליות AI"
    >
      תגליות AI ({discoverCount})
    </button>
  </div>
);

/**
 * תוצאות חיפוש מקומי
 */
interface SearchResultsProps {
  results: ExtendedResult[];
  onLookupSource: (index: number) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onLookupSource }) => {
  if (results.length === 0) {
    return <EmptyState message="לא נמצאו רצפים בטקסט. נסה טקסט אחר." />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((res, idx) => (
        <ResultCard key={idx} result={res} index={idx} onLookupSource={onLookupSource} />
      ))}
    </div>
  );
};

/**
 * כרטיס תוצאה בודדת
 */
interface ResultCardProps {
  result: ExtendedResult;
  index: number;
  onLookupSource: (index: number) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, index, onLookupSource }) => (
  <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-all border-r-4 border-r-amber-500 flex flex-col">
    <div className="flex justify-between items-start mb-4">
      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">
        {result.length} אותיות
      </span>
      {result.source ? (
        <div className="flex items-center gap-1 text-xs text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded border border-amber-200">
          <MapPin size={12} />
          {result.source.book} {result.source.chapter}:{result.source.verse}
        </div>
      ) : (
        <button
          onClick={() => onLookupSource(index)}
          disabled={result.isCheckingSource}
          className="text-[10px] text-stone-400 hover:text-amber-600 border border-stone-200 px-2 py-1 rounded transition-colors disabled:opacity-50"
          aria-label="זהה מקור בתנ&quot;ך"
        >
          {result.isCheckingSource ? 'מחפש...' : 'זהה מקור בתנ"ך'}
        </button>
      )}
    </div>

    <div className="text-3xl text-center font-bold tanakh-font text-stone-800 py-4 bg-stone-50 rounded-lg mb-4">
      {result.normalized}
    </div>

    <div className="mt-auto pt-4 border-t border-stone-100">
      <p className="text-stone-400 text-[10px] mb-1 uppercase tracking-wider font-bold">
        מקור מהטקסט:
      </p>
      <p className="text-stone-700 tanakh-font text-lg text-center leading-relaxed">
        {result.original}
      </p>
    </div>
  </div>
);

/**
 * תוצאות גילוי AI
 */
interface DiscoveryResultsProps {
  discoveries: AIDiscovery[];
}

const DiscoveryResults: React.FC<DiscoveryResultsProps> = ({ discoveries }) => {
  if (discoveries.length === 0) {
    return <EmptyState message="לחץ על 'גילוי פלינדרומים' כדי לחפש רצפים בתנ&quot;ך." />;
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {discoveries.map((discovery, idx) => (
        <DiscoveryCard key={idx} discovery={discovery} />
      ))}
    </div>
  );
};

/**
 * כרטיס תגלית AI
 */
interface DiscoveryCardProps {
  discovery: AIDiscovery;
}

const DiscoveryCard: React.FC<DiscoveryCardProps> = ({ discovery }) => (
  <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
    <div className="flex-1">
      <div className="flex flex-wrap items-center gap-3 text-amber-800 font-bold mb-3 border-b border-amber-200 pb-2">
        <div className="flex items-center gap-1 bg-amber-200 px-3 py-1 rounded-full text-sm">
          <BookOpen size={16} />
          {discovery.book}
        </div>
        <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm border border-amber-200">
          <span className="text-stone-400">פרק</span> {discovery.chapter}
        </div>
        <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm border border-amber-200">
          <span className="text-stone-400">פסוק</span> {discovery.verse}
        </div>
      </div>

      <h3 className="text-4xl font-bold tanakh-font text-stone-900 mb-4">
        {discovery.text}
      </h3>

      {discovery.meaning && (
        <div className="bg-white/50 p-4 rounded-lg border border-amber-100">
          <p className="text-stone-700 text-lg leading-relaxed flex gap-2">
            <Info size={20} className="text-amber-600 flex-shrink-0 mt-1" />
            {discovery.meaning}
          </p>
        </div>
      )}
    </div>

    <div className="bg-white p-6 rounded-full border-4 border-amber-200 shadow-inner hidden md:block">
      <Sparkles size={48} className="text-amber-500" />
    </div>
  </div>
);

/**
 * מצב ריק
 */
interface EmptyStateProps {
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20 text-stone-400">
    <div className="bg-stone-100 p-6 rounded-full mb-6">
      <Search size={48} strokeWidth={1} />
    </div>
    <p className="text-xl text-center max-w-md">{message}</p>
  </div>
);

/**
 * Footer
 */
const Footer: React.FC = () => (
  <footer className="w-full mt-12 py-8 border-t border-stone-200 text-center text-stone-500 text-sm">
    <p>כלי מחקר למבנה הטקסט המקראי - פלינדרומים בתנ"ך</p>
  </footer>
);

export default App;