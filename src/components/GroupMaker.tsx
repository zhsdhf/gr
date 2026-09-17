import React, { useState } from 'react';
import { 
  Users, 
  Shuffle, 
  Copy, 
  Check, 
  Download, 
  FileSpreadsheet,
  Maximize2, 
  Minimize2, 
  Sparkles, 
  ArrowRightLeft,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, GroupItem, GroupingStrategy, RemainderStrategy } from '../types';
import { soundManager } from '../utils/audio';

const GROUP_THEMES = [
  { name: '獅子組', icon: '🦁', bg: 'bg-amber-50/70', border: 'border-amber-200', text: 'text-amber-900', badgeBg: 'bg-amber-100 text-amber-800', tagBg: 'bg-white border-amber-200' },
  { name: '海豚組', icon: '🐬', bg: 'bg-cyan-50/70', border: 'border-cyan-200', text: 'text-cyan-900', badgeBg: 'bg-cyan-100 text-cyan-800', tagBg: 'bg-white border-cyan-200' },
  { name: '雄鷹組', icon: '🦅', bg: 'bg-indigo-50/70', border: 'border-indigo-200', text: 'text-indigo-900', badgeBg: 'bg-indigo-100 text-indigo-800', tagBg: 'bg-white border-indigo-200' },
  { name: '狐狸組', icon: '🦊', bg: 'bg-orange-50/70', border: 'border-orange-200', text: 'text-orange-900', badgeBg: 'bg-orange-100 text-orange-800', tagBg: 'bg-white border-orange-200' },
  { name: '熊貓組', icon: '🐼', bg: 'bg-emerald-50/70', border: 'border-emerald-200', text: 'text-emerald-900', badgeBg: 'bg-emerald-100 text-emerald-800', tagBg: 'bg-white border-emerald-200' },
  { name: '無尾熊組', icon: '🐨', bg: 'bg-violet-50/70', border: 'border-violet-200', text: 'text-violet-900', badgeBg: 'bg-violet-100 text-violet-800', tagBg: 'bg-white border-violet-200' },
  { name: '小鹿組', icon: '🦌', bg: 'bg-rose-50/70', border: 'border-rose-200', text: 'text-rose-900', badgeBg: 'bg-rose-100 text-rose-800', tagBg: 'bg-white border-rose-200' },
  { name: '企鵝組', icon: '🐧', bg: 'bg-blue-50/70', border: 'border-blue-200', text: 'text-blue-900', badgeBg: 'bg-blue-100 text-blue-800', tagBg: 'bg-white border-blue-200' },
  { name: '貓頭鷹組', icon: '🦉', bg: 'bg-teal-50/70', border: 'border-teal-200', text: 'text-teal-900', badgeBg: 'bg-teal-100 text-teal-800', tagBg: 'bg-white border-teal-200' },
  { name: '金剛組', icon: '🦍', bg: 'bg-slate-100/70', border: 'border-slate-300', text: 'text-slate-900', badgeBg: 'bg-slate-200 text-slate-800', tagBg: 'bg-white border-slate-300' },
  { name: '獵豹組', icon: '🐆', bg: 'bg-yellow-50/70', border: 'border-yellow-200', text: 'text-yellow-900', badgeBg: 'bg-yellow-100 text-yellow-800', tagBg: 'bg-white border-yellow-200' },
  { name: '火烈鳥組', icon: '🦩', bg: 'bg-pink-50/70', border: 'border-pink-200', text: 'text-pink-900', badgeBg: 'bg-pink-100 text-pink-800', tagBg: 'bg-white border-pink-200' },
];

interface GroupMakerProps {
  students: Student[];
  onSwitchToRoster: () => void;
  onLoadSample?: () => void;
}

export const GroupMaker: React.FC<GroupMakerProps> = ({
  students,
  onSwitchToRoster,
  onLoadSample,
}) => {
  // Strategy settings
  const [strategy, setStrategy] = useState<GroupingStrategy>('by_member_count');
  const [targetSize, setTargetSize] = useState<number>(4); // default 4 people per group
  const [groupCount, setGroupCount] = useState<number>(4); // default 4 groups
  const [remainderStrategy, setRemainderStrategy] = useState<RemainderStrategy>('distribute');

  // Groups state
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Moving member popup state
  const [movingStudent, setMovingStudent] = useState<{ student: Student; fromGroupId: string } | null>(null);

  // Calculate estimated outcome
  const total = students.length;
  const estimatedGroupCount = React.useMemo(() => {
    if (total === 0) return 0;
    if (strategy === 'by_member_count') {
      const size = Math.max(1, targetSize);
      if (remainderStrategy === 'distribute') {
        return Math.max(1, Math.round(total / size));
      }
      return Math.ceil(total / size);
    } else {
      return Math.min(total, Math.max(1, groupCount));
    }
  }, [total, strategy, targetSize, groupCount, remainderStrategy]);

  // Fisher-Yates shuffle
  const shuffleStudents = (array: Student[]): Student[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Perform grouping
  const performGrouping = () => {
    if (students.length === 0) return;

    setIsShuffling(true);
    soundManager.playWhoosh(1);

    // Short animation delay
    setTimeout(() => {
      const shuffled = shuffleStudents(students);
      const newGroups: GroupItem[] = [];

      if (strategy === 'by_member_count') {
        const size = Math.max(1, targetSize);
        if (remainderStrategy === 'distribute') {
          // Calculate ideal number of groups
          const numGroups = Math.max(1, Math.round(total / size));
          for (let i = 0; i < numGroups; i++) {
            const theme = GROUP_THEMES[i % GROUP_THEMES.length];
            newGroups.push({
              id: `grp-${i + 1}`,
              name: `第 ${i + 1} 組（${theme.name}）`,
              colorTheme: theme,
              iconName: theme.icon,
              members: [],
            });
          }
          // Distribute round-robin
          shuffled.forEach((student, index) => {
            newGroups[index % numGroups].members.push(student);
          });
        } else {
          // Chunk sequentially
          let groupIdx = 0;
          for (let i = 0; i < shuffled.length; i += size) {
            const chunk = shuffled.slice(i, i + size);
            const theme = GROUP_THEMES[groupIdx % GROUP_THEMES.length];
            newGroups.push({
              id: `grp-${groupIdx + 1}`,
              name: `第 ${groupIdx + 1} 組（${theme.name}）`,
              colorTheme: theme,
              iconName: theme.icon,
              members: chunk,
            });
            groupIdx++;
          }
        }
      } else {
        // By group count
        const numGroups = Math.min(total, Math.max(1, groupCount));
        for (let i = 0; i < numGroups; i++) {
          const theme = GROUP_THEMES[i % GROUP_THEMES.length];
          newGroups.push({
            id: `grp-${i + 1}`,
            name: `第 ${i + 1} 組（${theme.name}）`,
            colorTheme: theme,
            iconName: theme.icon,
            members: [],
          });
        }
        shuffled.forEach((student, index) => {
          newGroups[index % numGroups].members.push(student);
        });
      }

      setGroups(newGroups);
      setIsShuffling(false);
      soundManager.playFanfare();

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }, 450);
  };

  // Move student to another group
  const handleMoveStudent = (targetGroupId: string) => {
    if (!movingStudent) return;
    if (movingStudent.fromGroupId === targetGroupId) {
      setMovingStudent(null);
      return;
    }

    setGroups(prevGroups => {
      return prevGroups.map(grp => {
        if (grp.id === movingStudent.fromGroupId) {
          return {
            ...grp,
            members: grp.members.filter(m => m.id !== movingStudent.student.id),
          };
        }
        if (grp.id === targetGroupId) {
          return {
            ...grp,
            members: [...grp.members, movingStudent.student],
          };
        }
        return grp;
      });
    });

    soundManager.playPing();
    setMovingStudent(null);
  };

  // Copy result formatted
  const handleCopyResults = () => {
    if (groups.length === 0) return;

    let text = `📋 班級分組結果（全班共 ${total} 人 / 分為 ${groups.length} 組）\n`;
    text += `==============================\n\n`;

    groups.forEach((grp, idx) => {
      const memberNames = grp.members.map(m => m.seatNumber ? `${m.name}(${m.seatNumber}號)` : m.name).join('、');
      text += `【${grp.name}】(${grp.members.length}人)\n`;
      text += `組員：${memberNames || '無'}\n\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Download txt
  const handleDownloadTxt = () => {
    if (groups.length === 0) return;
    let text = `班級分組結果\n日期：${new Date().toLocaleDateString()}\n\n`;
    groups.forEach((grp) => {
      text += `${grp.name} (${grp.members.length}人):\n`;
      grp.members.forEach((m, i) => {
        text += `  ${i + 1}. ${m.name} ${m.seatNumber ? `[座號 ${m.seatNumber}]` : ''}\n`;
      });
      text += `\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `分組結果_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download CSV with UTF-8 BOM for Microsoft Excel compatibility
  const handleDownloadCSV = () => {
    if (groups.length === 0) return;
    const headers = ['組別編號', '組別名稱', '組內序號', '座號', '學生姓名'];
    const rows: string[] = [headers.join(',')];

    groups.forEach((grp, gIdx) => {
      grp.members.forEach((m, mIdx) => {
        const row = [
          gIdx + 1,
          `"${grp.name.replace(/"/g, '""')}"`,
          mIdx + 1,
          m.seatNumber ?? '',
          `"${m.name.replace(/"/g, '""')}"`,
        ];
        rows.push(row.join(','));
      });
    });

    // \uFEFF ensures Excel interprets UTF-8 Chinese characters correctly
    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `班級分組結果_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="group-maker-module" className="space-y-6">
      {/* Settings Panel */}
      <div id="group-settings-card" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              自動分組設定
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              現有名單 <strong className="text-slate-800">{students.length}</strong> 位同學，設定每組人數後一鍵隨機均勻分配
            </p>
          </div>

          {/* Strategy Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              id="btn-strategy-by-size"
              type="button"
              onClick={() => setStrategy('by_member_count')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                strategy === 'by_member_count'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              設定每組人數
            </button>
            <button
              id="btn-strategy-by-count"
              type="button"
              onClick={() => setStrategy('by_group_count')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                strategy === 'by_group_count'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              設定分成幾組
            </button>
          </div>
        </div>

        {/* Dynamic Controls based on selected mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-5">
          {strategy === 'by_member_count' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                每組人數（幾個人一組）
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="input-group-size"
                  type="number"
                  min={1}
                  max={Math.max(1, students.length)}
                  value={targetSize}
                  onChange={(e) => setTargetSize(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-24 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-500">人 / 組</span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                預計分成組數
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="input-group-count"
                  type="number"
                  min={1}
                  max={Math.max(1, students.length)}
                  value={groupCount}
                  onChange={(e) => setGroupCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-24 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-500">組</span>
              </div>
            </div>
          )}

          {/* Remainder option when setting by member count */}
          {strategy === 'by_member_count' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                餘數人數分配方式
              </label>
              <select
                id="select-remainder-strategy"
                value={remainderStrategy}
                onChange={(e) => setRemainderStrategy(e.target.value as RemainderStrategy)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="distribute">平均分散至各組（避免多出一小組）</option>
                <option value="last_group">剩餘人員獨立成最後一組</option>
              </select>
            </div>
          )}

          {/* Forecast Box */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 flex flex-col justify-center">
            <span className="text-[11px] font-semibold text-indigo-700 uppercase">預估分組結果</span>
            <p className="text-xs text-indigo-900 mt-1 font-medium">
              全班 {total} 人 &rarr; 預計分為 <strong>{estimatedGroupCount}</strong> 組
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {students.length === 0 ? (
              <span className="text-rose-500 font-medium">目前名單為空，請先加入學生</span>
            ) : (
              <span>每次點擊皆會重新隨機打散學員</span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {students.length === 0 ? (
              <>
                {onLoadSample && (
                  <button
                    id="btn-group-load-sample"
                    onClick={onLoadSample}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    一鍵載入模擬名單（28人）
                  </button>
                )}
                <button
                  onClick={onSwitchToRoster}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  前往匯入名單
                </button>
              </>
            ) : (
              <button
                id="btn-do-grouping"
                type="button"
                onClick={performGrouping}
                disabled={isShuffling}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-indigo-200 transition-all flex items-center gap-2 transform active:scale-95"
              >
                <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
                <span>{isShuffling ? '正在隨機分組...' : groups.length > 0 ? '重新隨機分組' : '開始自動分組！'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Visualized Group Results Display */}
      {groups.length > 0 && (
        <div 
          id="groups-display-section"
          className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-6 sm:p-10 overflow-y-auto text-white' : ''}`}
        >
          {/* Action Header for groups */}
          <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border ${
            isFullscreen ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                ✓
              </span>
              <div>
                <h3 className={`font-bold text-sm sm:text-base ${isFullscreen ? 'text-white' : 'text-slate-800'}`}>
                  分組視覺化呈現（共 {groups.length} 組）
                </h3>
                <p className={`text-xs ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
                  可點選學生標籤進行微調跨組移動，或全螢幕投影展示
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Copy results */}
              <button
                id="btn-copy-group-result"
                onClick={handleCopyResults}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  copied 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                    : isFullscreen 
                      ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已複製到剪貼簿！' : '複製結果'}</span>
              </button>

              {/* Download CSV */}
              <button
                id="btn-download-group-csv"
                onClick={handleDownloadCSV}
                title="下載 Excel 相容的 CSV 檔案"
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isFullscreen 
                    ? 'bg-emerald-600/90 border-emerald-500 text-white hover:bg-emerald-600' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 shadow-2xs'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>下載 CSV</span>
              </button>

              {/* Download text */}
              <button
                id="btn-download-group-txt"
                onClick={handleDownloadTxt}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isFullscreen 
                    ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">下載文字檔</span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                id="btn-toggle-group-fullscreen"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isFullscreen 
                    ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700' 
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isFullscreen ? '退出全螢幕' : '全螢幕投影'}</span>
              </button>
            </div>
          </div>

          {/* Move Student Dialog Modal */}
          {movingStudent && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <h4 className="font-bold text-sm flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                    調整學生組別
                  </h4>
                  <button 
                    onClick={() => setMovingStudent(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-600 mb-4">
                  正在將學生 <strong className="text-slate-900 font-bold">{movingStudent.student.name}</strong> 移動至：
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {groups.map(grp => (
                    <button
                      key={grp.id}
                      onClick={() => handleMoveStudent(grp.id)}
                      disabled={grp.id === movingStudent.fromGroupId}
                      className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors border ${
                        grp.id === movingStudent.fromGroupId
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-50 hover:bg-indigo-50 border-slate-200 hover:border-indigo-300 text-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{grp.iconName}</span>
                        <span>{grp.name}</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        ({grp.members.length} 人)
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groups.map((group, gIdx) => {
              const theme = group.colorTheme;
              return (
                <div
                  key={group.id}
                  className={`rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md ${
                    isFullscreen 
                      ? 'bg-slate-800/80 border-slate-700' 
                      : `${theme.bg} ${theme.border}`
                  }`}
                >
                  <div>
                    {/* Group Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-black/5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-2xl shrink-0">{group.iconName}</span>
                        <input
                          type="text"
                          value={group.name}
                          onChange={(e) => {
                            const newName = e.target.value;
                            setGroups(prev => prev.map(g => g.id === group.id ? { ...g, name: newName } : g));
                          }}
                          className={`font-bold text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none truncate ${
                            isFullscreen ? 'text-white' : theme.text
                          }`}
                          title="可直接點選修改組名"
                        />
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold shrink-0 ${theme.badgeBg}`}>
                        {group.members.length} 人
                      </span>
                    </div>

                    {/* Member Pills */}
                    <div className="mt-3.5 space-y-2">
                      {group.members.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          此組尚無成員
                        </div>
                      ) : (
                        group.members.map((member, mIdx) => (
                          <div
                            key={member.id}
                            className={`group relative flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                              isFullscreen 
                                ? 'bg-slate-700/80 border-slate-600 text-slate-100 hover:bg-slate-700' 
                                : `${theme.tagBg} shadow-2xs hover:shadow-xs text-slate-800`
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {member.seatNumber || (mIdx + 1)}
                              </span>
                              <span className="font-semibold truncate">
                                {member.name}
                              </span>
                            </div>

                            {/* Quick move button */}
                            <button
                              onClick={() => setMovingStudent({ student: member, fromGroupId: group.id })}
                              title="移動至其他組"
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Card footer info */}
                  <div className="mt-4 pt-2 border-t border-black/5 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>第 {gIdx + 1} 組</span>
                    <span>佔比 {Math.round((group.members.length / total) * 100)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
