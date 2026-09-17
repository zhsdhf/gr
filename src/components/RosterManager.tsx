import React, { useState, useRef, useMemo } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  ClipboardPaste, 
  Trash2, 
  Plus, 
  Sparkles, 
  Users, 
  Search, 
  Download,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  BookOpen,
  ArrowRight,
  FilterX
} from 'lucide-react';
import { Student } from '../types';
import { 
  SAMPLE_STUDENTS, 
  SIMULATED_ROSTER_PRESETS,
  SimulatedPreset,
  SAMPLE_DUPLICATE_PASTE_TEXT,
  SAMPLE_CSV_DUPLICATE_CONTENT,
  downloadSampleCSVFile,
  parseRawTextToStudents, 
  parseCSV, 
  convertCSVToStudents,
  getDuplicateNamesSet,
  removeDuplicatesFromStudents,
  removeDuplicatesFromCSVRows
} from '../utils/csvParser';
import { soundManager } from '../utils/audio';

interface RosterManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  onClearHistory: () => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  students,
  onUpdateStudents,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'import-paste' | 'import-csv' | 'simulated'>('manage');
  const [pasteText, setPasteText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newSeatNumber, setNewSeatNumber] = useState<string>('');
  
  // CSV preview state
  const [csvPreview, setCsvPreview] = useState<{
    headers: string[];
    rows: string[][];
    nameColIdx: number;
    seatColIdx: number;
    fileName: string;
  } | null>(null);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotice = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Check duplicates in active roster
  const activeDuplicateNames = useMemo(() => {
    return getDuplicateNamesSet(students.map(s => s.name));
  }, [students]);

  // Check duplicates in CSV preview
  const csvDuplicateNames = useMemo(() => {
    if (!csvPreview || csvPreview.rows.length === 0 || csvPreview.nameColIdx < 0) {
      return new Set<string>();
    }
    const names = csvPreview.rows.map(r => r[csvPreview.nameColIdx]?.trim()).filter(Boolean);
    return getDuplicateNamesSet(names);
  }, [csvPreview]);

  // Check duplicates in pasted text
  const parsedPasteStudents = useMemo(() => {
    return parseRawTextToStudents(pasteText);
  }, [pasteText]);

  const pasteDuplicateNames = useMemo(() => {
    return getDuplicateNamesSet(parsedPasteStudents.map(s => s.name));
  }, [parsedPasteStudents]);

  // Load simulated preset
  const handleLoadPreset = (preset: SimulatedPreset) => {
    onUpdateStudents(preset.students);
    onClearHistory();
    soundManager.playPing();
    showNotice(`已載入「${preset.title}」（共 ${preset.students.length} 名學生）`);
    setActiveTab('manage');
  };

  // Remove duplicates from CSV preview
  const handleRemoveDuplicatesFromCSV = () => {
    if (!csvPreview) return;
    const { uniqueRows, removedCount } = removeDuplicatesFromCSVRows(csvPreview.rows, csvPreview.nameColIdx);
    if (removedCount === 0) {
      showNotice('名單中無重複姓名', 'info');
      return;
    }
    setCsvPreview({
      ...csvPreview,
      rows: uniqueRows,
    });
    soundManager.playPing();
    showNotice(`已為您一次性移除 ${removedCount} 筆重複學生姓名！`, 'success');
  };

  // Remove duplicates from Paste
  const handleRemoveDuplicatesFromPaste = () => {
    const { unique, removedCount, removedNames } = removeDuplicatesFromStudents(parsedPasteStudents);
    if (removedCount === 0) {
      showNotice('名單中無重複姓名', 'info');
      return;
    }
    // Reconstruct paste text cleanly
    const cleanedText = unique.map(s => s.seatNumber ? `${s.seatNumber}. ${s.name}` : s.name).join('\n');
    setPasteText(cleanedText);
    soundManager.playPing();
    showNotice(`已移除 ${removedCount} 筆重複姓名（${Array.from(new Set(removedNames)).join('、')}）`, 'success');
  };

  // Remove duplicates from current active roster
  const handleRemoveDuplicatesFromActiveRoster = () => {
    const { unique, removedCount, removedNames } = removeDuplicatesFromStudents(students);
    if (removedCount === 0) return;
    onUpdateStudents(unique);
    soundManager.playPing();
    showNotice(`已清理 ${removedCount} 筆重複學生資料（${Array.from(new Set(removedNames)).join('、')}）`, 'success');
  };

  const handleApplyPaste = () => {
    if (parsedPasteStudents.length === 0) {
      alert('請先輸入或貼上學生姓名');
      return;
    }
    onUpdateStudents(parsedPasteStudents);
    onClearHistory();
    soundManager.playPing();
    showNotice(`成功匯入 ${parsedPasteStudents.length} 名學生`);
    setPasteText('');
    setActiveTab('manage');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const parsed = parseCSV(content);
      if (parsed.headers.length === 0 && parsed.rows.length === 0) {
        alert('無法解析此 CSV 檔案，請確認內容格式');
        return;
      }

      setCsvPreview({
        headers: parsed.headers,
        rows: parsed.rows,
        nameColIdx: Math.max(0, parsed.suggestedNameColumnIndex),
        seatColIdx: parsed.suggestedSeatColumnIndex,
        fileName: file.name,
      });
      setActiveTab('import-csv');
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  // Instant one-click test of CSV duplicates without requiring the teacher to have a file on disk
  const handleLoadDuplicateTestCSV = () => {
    const parsed = parseCSV(SAMPLE_CSV_DUPLICATE_CONTENT);
    setCsvPreview({
      headers: parsed.headers,
      rows: parsed.rows,
      nameColIdx: Math.max(0, parsed.suggestedNameColumnIndex),
      seatColIdx: parsed.suggestedSeatColumnIndex,
      fileName: '示範測試_含重複名單.csv',
    });
    setActiveTab('import-csv');
    soundManager.playPing();
    showNotice('已為您載入「含重複姓名測試 CSV」，請檢視預覽標記並點擊「一鍵移除重複姓名」體驗！', 'warning');
  };

  // Instant one-click fill of duplicate paste text
  const handleFillDuplicatePaste = () => {
    setPasteText(SAMPLE_DUPLICATE_PASTE_TEXT);
    soundManager.playPing();
    showNotice('已填入含重複姓名的範例文字，請查看下方重複標記與一鍵去重按鈕！', 'warning');
  };

  const handleConfirmCSV = () => {
    if (!csvPreview) return;
    const converted = convertCSVToStudents(
      csvPreview.rows,
      csvPreview.nameColIdx,
      csvPreview.seatColIdx
    );
    if (converted.length === 0) {
      alert('未能從選定欄位提取出有效學生姓名');
      return;
    }
    onUpdateStudents(converted);
    onClearHistory();
    soundManager.playPing();
    showNotice(`成功從 ${csvPreview.fileName} 匯入 ${converted.length} 名學生`);
    setCsvPreview(null);
    setActiveTab('manage');
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const nextSeat = newSeatNumber.trim() 
      ? parseInt(newSeatNumber.trim(), 10) 
      : students.length + 1;

    const newStudent: Student = {
      id: `std-${Date.now()}`,
      seatNumber: isNaN(nextSeat) ? students.length + 1 : nextSeat,
      name: newStudentName.trim(),
    };

    onUpdateStudents([...students, newStudent]);
    setNewStudentName('');
    setNewSeatNumber('');
    soundManager.playPing();
    showNotice(`已新增學生：${newStudent.name}`);
  };

  const handleDeleteStudent = (id: string) => {
    const updated = students.filter(s => s.id !== id);
    onUpdateStudents(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('確定要清空整份學生名單嗎？此操作將會重置所有抽籤歷史。')) {
      onUpdateStudents([]);
      onClearHistory();
      soundManager.playPing();
      showNotice('已清空學生名單', 'info');
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) return;
    const csvContent = '座號,姓名\n' + students.map(s => `${s.seatNumber || ''},"${s.name}"`).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `學生名單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.seatNumber && s.seatNumber.toString().includes(searchQuery))
  );

  return (
    <div id="roster-manager-container" className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div id="roster-notification" className={`p-3.5 border rounded-2xl flex items-center justify-between shadow-xs transition-all ${
          notification.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : notification.type === 'info'
            ? 'bg-sky-50 border-sky-200 text-sky-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Teacher Quick Guide / Feature intro banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-indigo-50/50 border border-indigo-100 rounded-3xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">課堂助手操作流程指引</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                1. 透過下方匯入 CSV 或貼上名單（亦可載入<strong>模擬名單</strong>快速體驗）&rarr; 2. 至<strong>隨機抽籤</strong>進行動態點名 &rarr; 3. 至<strong>自動分組</strong>產出視覺化小組並下載 CSV
              </p>
            </div>
          </div>
          <button
            id="btn-open-simulated-modal"
            onClick={() => setActiveTab('simulated')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-center"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>探索模擬名單庫</span>
          </button>
        </div>
      </div>

      {/* Top action cards & source selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Source 1: CSV Upload */}
        <div 
          id="card-upload-csv"
          className="group relative bg-white border border-slate-200 hover:border-indigo-400 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv,.txt" 
            className="hidden" 
          />
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800 text-base">上傳 CSV / 檔案</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              支援包含「姓名」與「座號」的 CSV 或 TXT，具備<strong>重複姓名自動標記與一鍵去重</strong>
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>選擇電腦檔案</span>
            </button>
            <button
              type="button"
              onClick={handleLoadDuplicateTestCSV}
              title="載入含重複姓名的示範 CSV，可直接體驗標記與一鍵移除功能"
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>測試重複名單 CSV</span>
            </button>
          </div>
        </div>

        {/* Source 2: Paste names */}
        <div 
          id="card-paste-names"
          className={`group relative bg-white border p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
            activeTab === 'import-paste' ? 'border-sky-600 ring-2 ring-sky-100' : 'border-slate-200 hover:border-sky-400'
          }`}
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ClipboardPaste className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800 text-base">貼上學生名單</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              直接從 Excel、Word 或通訊軟體複製整列姓名，貼上時即時偵測重複姓名
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('import-paste')}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>開啟貼上輸入框</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('import-paste');
                handleFillDuplicatePaste();
              }}
              title="快速帶入含重複姓名的文字，測試重複標記與一鍵去重"
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>填入含重複範例</span>
            </button>
          </div>
        </div>

        {/* Source 3: Simulated Rosters */}
        <div 
          id="card-simulated-rosters"
          onClick={() => setActiveTab('simulated')}
          className={`group relative bg-white border p-5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'simulated' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200 hover:border-amber-400'
          }`}
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800 text-base">模擬名單體驗庫</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              提供 28 人標準班、12 人研討班、40 人大班級及<strong>重複姓名測試名單</strong>
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs font-semibold text-amber-600 gap-1">
            <span>展開模擬名單（4種情境）</span>
            <span aria-hidden="true">&rarr;</span>
          </div>
        </div>
      </div>

      {/* Simulated Rosters Drawer / Selection Panel */}
      {activeTab === 'simulated' && (
        <div id="simulated-roster-panel" className="bg-white border border-amber-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-base">模擬名單庫（快速體驗與教學使用）</h3>
                <p className="text-xs text-slate-500">點選任一預設名單即可一鍵載入，供老師快速熟悉系統所有操作</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => downloadSampleCSVFile(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                title="下載標準 28 人 CSV 檔案，可練習手動上傳"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下載標準 CSV 範例</span>
              </button>
              <button
                type="button"
                onClick={() => downloadSampleCSVFile(true)}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                title="下載含重複姓名的 CSV 檔案，可練習測試重複標記與一鍵移除"
              >
                <Download className="w-3.5 h-3.5 text-amber-600" />
                <span>下載含重複 CSV 範例</span>
              </button>
              <button 
                onClick={() => setActiveTab('manage')}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            {SIMULATED_ROSTER_PRESETS.map((preset) => (
              <div 
                key={preset.id}
                className={`border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                  preset.id === 'duplicate-test'
                    ? 'border-amber-300 bg-amber-50/40 hover:border-amber-500 hover:shadow-md'
                    : 'border-slate-200 hover:border-amber-400 hover:shadow-sm bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                      preset.id === 'duplicate-test' 
                        ? 'bg-amber-200 text-amber-900' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {preset.count} 人
                    </span>
                    {preset.id === 'duplicate-test' ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-md border border-rose-200">
                        ⚠️ 含 4 處重複姓名
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        示範名單
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{preset.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {preset.description}
                  </p>
                  
                  {/* Sample preview tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {preset.students.slice(0, 6).map((s, idx) => (
                      <span key={idx} className="text-[11px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                        {s.name}
                      </span>
                    ))}
                    {preset.students.length > 6 && (
                      <span className="text-[11px] text-slate-400 px-1 py-0.5">
                        +{preset.students.length - 6}人...
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleLoadPreset(preset)}
                  className={`mt-4 w-full py-2 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    preset.id === 'duplicate-test'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-white hover:bg-amber-500 hover:text-white border border-slate-300 hover:border-amber-500 text-slate-700'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>套用此名單</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV Parser Modal / Box with Duplicate Detection & Removal */}
      {csvPreview && activeTab === 'import-csv' && (
        <div id="csv-preview-panel" className="bg-white border border-indigo-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-semibold text-slate-800">CSV 檔案解析預覽：{csvPreview.fileName}</h3>
                <p className="text-xs text-slate-500">已讀取 {csvPreview.rows.length} 筆資料</p>
              </div>
            </div>
            <button 
              onClick={() => setCsvPreview(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Column mappings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                學生姓名欄位 <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-name-column"
                value={csvPreview.nameColIdx}
                onChange={(e) => setCsvPreview({ ...csvPreview, nameColIdx: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {csvPreview.headers.map((h, idx) => (
                  <option key={idx} value={idx}>
                    欄位 {idx + 1}：{h || `第 ${idx + 1} 欄`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                座號欄位（選填）
              </label>
              <select
                id="select-seat-column"
                value={csvPreview.seatColIdx}
                onChange={(e) => setCsvPreview({ ...csvPreview, seatColIdx: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={-1}>自動依序編號 (1, 2, 3...)</option>
                {csvPreview.headers.map((h, idx) => (
                  <option key={idx} value={idx}>
                    欄位 {idx + 1}：{h || `第 ${idx + 1} 欄`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duplicate Warning & Removal Bar in CSV */}
          {csvDuplicateNames.size > 0 ? (
            <div id="csv-duplicate-banner" className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shadow-xs">
              <div className="flex items-start sm:items-center gap-2.5 text-amber-950 text-xs sm:text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <span className="font-bold">在「學生姓名」欄位發現重複姓名：</span>
                  <span className="ml-1 text-rose-700 font-bold">
                    {Array.from(csvDuplicateNames).slice(0, 5).join('、')}
                    {csvDuplicateNames.size > 5 ? ` 等共 ${csvDuplicateNames.size} 種重複` : ''}
                  </span>
                  <p className="text-xs text-amber-800 mt-0.5">
                    預覽表格中已標記黃色背景與警告標籤，您可以點擊右側按鈕一次性清除重複學生：
                  </p>
                </div>
              </div>
              <button
                id="btn-remove-csv-duplicates"
                type="button"
                onClick={handleRemoveDuplicatesFromCSV}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shrink-0 shadow-sm flex items-center gap-1.5 transition-all transform active:scale-95 self-start sm:self-center cursor-pointer"
              >
                <FilterX className="w-4 h-4" />
                <span>一鍵移除重複姓名</span>
              </button>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>姓名欄位檢測正常，無重複項目</span>
            </div>
          )}

          {/* Preview rows table with duplicate highlights */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">預覽清單（顯示前 10 筆）：</p>
              <span className="text-xs text-slate-400">目前共 {csvPreview.rows.length} 筆</span>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-60">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5 text-center w-12">#</th>
                    {csvPreview.headers.map((h, i) => (
                      <th key={i} className={`p-2.5 ${i === csvPreview.nameColIdx ? 'bg-indigo-100 text-indigo-900 font-bold' : ''}`}>
                        {h || `第 ${i + 1} 欄`} {i === csvPreview.nameColIdx ? '(姓名)' : i === csvPreview.seatColIdx ? '(座號)' : ''}
                      </th>
                    ))}
                    <th className="p-2.5 text-center w-28">檢測狀態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {csvPreview.rows.slice(0, 10).map((row, rIdx) => {
                    const rowName = row[csvPreview.nameColIdx]?.trim();
                    const isDup = rowName && csvDuplicateNames.has(rowName);
                    return (
                      <tr key={rIdx} className={`hover:bg-slate-50 transition-colors ${isDup ? 'bg-amber-100/70 border-l-4 border-amber-500' : ''}`}>
                        <td className="p-2.5 text-center text-slate-400 font-mono">{rIdx + 1}</td>
                        {row.map((cell, cIdx) => {
                          const isNameCol = cIdx === csvPreview.nameColIdx;
                          return (
                            <td key={cIdx} className={`p-2.5 ${isNameCol ? 'font-medium' : ''}`}>
                              {isNameCol && isDup ? (
                                <span className="inline-flex items-center gap-1.5 font-bold text-amber-950">
                                  <span className="underline decoration-amber-500 decoration-2">{cell}</span>
                                </span>
                              ) : (
                                cell
                              )}
                            </td>
                          );
                        })}
                        <td className="p-2.5 text-center">
                          {isDup ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-200 text-amber-900 border border-amber-300 rounded-md text-[11px] font-bold shadow-2xs">
                              <AlertTriangle className="w-3 h-3 text-amber-700" />
                              <span>重複姓名</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">正常</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              onClick={() => setCsvPreview(null)}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
            >
              取消
            </button>
            <button
              id="btn-confirm-csv-import"
              onClick={handleConfirmCSV}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors"
            >
              確認匯入名單（共 {csvPreview.rows.length} 位）
            </button>
          </div>
        </div>
      )}

      {/* Paste names input panel with Duplicate Warning & Removal */}
      {activeTab === 'import-paste' && (
        <div id="paste-names-panel" className="bg-white border border-sky-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <ClipboardPaste className="w-5 h-5 text-sky-600" />
              <h3 className="font-semibold text-slate-800">直接貼上學生名單</h3>
            </div>
            <button 
              onClick={() => setActiveTab('manage')}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500">
              請將學生姓名貼於下方。格式可為每行一個姓名，或「01 陳子豪」附帶座號，或以逗號隔開：
            </p>
            <button
              type="button"
              onClick={handleFillDuplicatePaste}
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>填入含重複名單範例</span>
            </button>
          </div>

          <textarea
            id="textarea-paste-roster"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"例如：\n陳子豪\n林若曦\n張宇廷\n李佳蓉\n或：\n1. 王俊傑, 2. 黃詩涵"}
            rows={6}
            className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
          />

          {/* Paste Duplicates Detection & Removal */}
          {pasteDuplicateNames.size > 0 && (
            <div id="paste-duplicate-banner" className="mt-3 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-amber-950">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <span className="font-bold">貼入文字中發現重複學生姓名：</span>
                  <strong className="ml-1 text-rose-700 font-bold">{Array.from(pasteDuplicateNames).join('、')}</strong>
                  <p className="text-xs text-amber-800 mt-0.5">
                    下方預覽標籤已標示「重複」，點擊按鈕可自動清理輸入文字並保留每位同學第一筆紀錄：
                  </p>
                </div>
              </div>
              <button
                id="btn-remove-paste-duplicates"
                type="button"
                onClick={handleRemoveDuplicatesFromPaste}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shrink-0 shadow-sm flex items-center gap-1.5 transition-all transform active:scale-95 self-start sm:self-center cursor-pointer"
              >
                <FilterX className="w-4 h-4" />
                <span>一鍵移除重複姓名</span>
              </button>
            </div>
          )}

          {/* Live Preview parsed chips */}
          {parsedPasteStudents.length > 0 && (
            <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">
                  即時解析預覽（共 {parsedPasteStudents.length} 人）：
                </span>
                {pasteDuplicateNames.size > 0 && (
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                    ⚠️ 含重複項目
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                {parsedPasteStudents.map((std, idx) => {
                  const isDup = pasteDuplicateNames.has(std.name);
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all ${
                        isDup 
                          ? 'bg-amber-100 border-2 border-amber-400 text-amber-950 font-bold ring-1 ring-amber-300 shadow-2xs' 
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{std.seatNumber ? `${std.seatNumber}. ` : ''}{std.name}</span>
                      {isDup && (
                        <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.2 rounded font-bold">
                          重複
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              預計可提取：<span className="font-semibold text-slate-800">{parsedPasteStudents.length}</span> 人
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setPasteText(''); setActiveTab('manage'); }}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium"
              >
                取消
              </button>
              <button
                id="btn-confirm-paste-import"
                onClick={handleApplyPaste}
                disabled={parsedPasteStudents.length === 0}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-xs transition-colors"
              >
                確認匯入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roster Table & Active Duplicates Alert */}
      <div id="roster-list-card" className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {/* Active Roster Duplicates warning if any */}
        {activeDuplicateNames.size > 0 && (
          <div id="active-roster-duplicate-alert" className="p-3.5 bg-amber-50 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                目前班級名單中存在重複姓名：<strong>{Array.from(activeDuplicateNames).join('、')}</strong>
              </span>
            </div>
            <button
              id="btn-cleanup-active-duplicates"
              onClick={handleRemoveDuplicatesFromActiveRoster}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs flex items-center gap-1 transition-colors self-start sm:self-center"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>一鍵清理重複項</span>
            </button>
          </div>
        )}

        {/* Header & Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800 text-lg">目前班級名單</h2>
                <span id="badge-total-students" className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                  共 {students.length} 位同學
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">名單自動儲存於瀏覽器，抽籤與分組共用此名單</p>
            </div>
          </div>

          {/* Search and Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-search-student"
                type="text"
                placeholder="搜尋姓名或座號..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40 sm:w-48"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {students.length > 0 && (
              <>
                <button
                  id="btn-export-csv"
                  onClick={handleExportCSV}
                  title="匯出名單為 CSV"
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">匯出名單</span>
                </button>
                <button
                  id="btn-clear-roster"
                  onClick={handleClearAll}
                  title="清空名單"
                  className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">清空</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleAddSingleStudent} className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            快速新增單一學生：
          </span>
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input
              id="input-new-seat"
              type="number"
              placeholder={`座號 (${students.length + 1})`}
              value={newSeatNumber}
              onChange={(e) => setNewSeatNumber(e.target.value)}
              className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              id="input-new-student-name"
              type="text"
              placeholder="輸入學生姓名..."
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            id="btn-add-student"
            type="submit"
            disabled={!newStudentName.trim()}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition-colors shrink-0"
          >
            新增
          </button>
        </form>

        {/* Students Grid or Empty State */}
        {students.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800">尚無學生名單</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              請點選上方「上傳 CSV」或「貼上學生名單」，亦可切換至「模擬名單體驗區」快速載入。
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setActiveTab('simulated')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                開啟模擬名單庫
              </button>
              <button
                onClick={() => setActiveTab('import-paste')}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl transition-colors"
              >
                手動貼上名單
              </button>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            查無符合「{searchQuery}」的學生
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-[460px] overflow-y-auto">
            {filteredStudents.map((student, idx) => {
              const isDuplicate = activeDuplicateNames.has(student.name);
              return (
                <div
                  key={student.id}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl transition-all border ${
                    isDuplicate
                      ? 'bg-amber-50/90 border-amber-300'
                      : 'bg-slate-50/80 hover:bg-indigo-50/60 border-slate-200/80 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`w-6 h-6 shrink-0 rounded-lg text-[11px] font-bold flex items-center justify-center border ${
                      isDuplicate 
                        ? 'bg-amber-100 text-amber-900 border-amber-300' 
                        : 'bg-white border-slate-200 group-hover:border-indigo-300 text-slate-600 group-hover:text-indigo-600'
                    }`}>
                      {student.seatNumber ?? (idx + 1)}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 truncate" title={student.name}>
                      {student.name}
                    </span>
                    {isDuplicate && (
                      <span className="text-[9px] bg-amber-600 text-white px-1 py-0.2 rounded font-bold shrink-0">
                        重
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteStudent(student.id)}
                    title="刪除"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
