import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Award, 
  Users, 
  History, 
  Clock, 
  Check, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, DrawMode, DrawHistoryRecord } from '../types';
import { soundManager } from '../utils/audio';

interface RandomPickerProps {
  students: Student[];
  history: DrawHistoryRecord[];
  onAddHistory: (record: DrawHistoryRecord) => void;
  onClearHistory: () => void;
  onRemoveHistoryItem: (id: string) => void;
  onSwitchToRoster: () => void;
  onLoadSample?: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  history,
  onAddHistory,
  onClearHistory,
  onRemoveHistoryItem,
  onSwitchToRoster,
  onLoadSample,
}) => {
  // Settings
  const [drawMode, setDrawMode] = useState<DrawMode>('without_replacement');
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drawing state
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>('點擊「開始抽籤」');
  const [displaySeat, setDisplaySeat] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [recentlyDrawnIds, setRecentlyDrawnIds] = useState<Set<string>>(new Set());

  // In "without_replacement" mode, calculate candidate pool
  useEffect(() => {
    if (drawMode === 'without_replacement') {
      const drawnIds = new Set(history.map(h => h.studentId));
      setRecentlyDrawnIds(drawnIds);
    } else {
      setRecentlyDrawnIds(new Set());
    }
  }, [drawMode, history]);

  // Candidates available for drawing
  const candidateStudents = React.useMemo(() => {
    if (drawMode === 'without_replacement') {
      return students.filter(s => !recentlyDrawnIds.has(s.id));
    }
    return students;
  }, [students, recentlyDrawnIds, drawMode]);

  // Toggle sound
  const handleToggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    soundManager.setMuted(nextState);
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Main draw handler with dynamic deceleration animation and sound
  const startDraw = () => {
    if (students.length === 0) return;
    if (drawMode === 'without_replacement' && candidateStudents.length === 0) {
      alert('所有學生皆已抽出過一次！請點選「重置抽籤池」開始新的一輪。');
      return;
    }

    setIsRolling(true);
    setSelectedStudent(null);

    // Pick target winner in advance from the valid candidate pool
    const targetPool = candidateStudents;
    const winnerIndex = Math.floor(Math.random() * targetPool.length);
    const winner = targetPool[winnerIndex];

    // Animation frames scheduling
    const totalSteps = 28;
    let step = 0;

    const rollNext = () => {
      step++;
      // Pick random student to display on each rolling frame
      const randomIndex = Math.floor(Math.random() * students.length);
      const randomCandidate = students[randomIndex];
      setDisplayName(randomCandidate.name);
      setDisplaySeat(randomCandidate.seatNumber || null);

      // Sound tick: frequency increases pitch slightly towards end
      const pitch = 0.8 + (step / totalSteps) * 0.6;
      soundManager.playTick(pitch);

      if (step < totalSteps) {
        // Easing delay curve: starts fast (~45ms), slows down exponentially near the end (~400ms)
        const progress = step / totalSteps;
        const delay = 40 + Math.pow(progress, 3) * 380;
        setTimeout(rollNext, delay);
      } else {
        // Final reveal!
        setTimeout(() => {
          setDisplayName(winner.name);
          setDisplaySeat(winner.seatNumber || null);
          setSelectedStudent(winner);
          setIsRolling(false);

          // Fanfare sound & Confetti
          soundManager.playFanfare();
          try {
            confetti({
              particleCount: 90,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#4f46e5', '#06b6d4', '#f59e0b', '#ec4899', '#10b981'],
            });
          } catch {
            // ignore
          }

          // Record in history
          const newRecord: DrawHistoryRecord = {
            id: `rec-${Date.now()}`,
            studentId: winner.id,
            studentName: winner.name,
            timestamp: Date.now(),
            orderNumber: history.length + 1,
          };
          onAddHistory(newRecord);
        }, 300);
      }
    };

    rollNext();
  };

  const handleResetPool = () => {
    onClearHistory();
    setSelectedStudent(null);
    setDisplayName('抽籤池已重置，準備開始');
    setDisplaySeat(null);
    soundManager.playPing();
  };

  const isPoolExhausted = drawMode === 'without_replacement' && candidateStudents.length === 0 && students.length > 0;

  return (
    <div 
      ref={containerRef}
      id="random-picker-module" 
      className={`space-y-6 ${isFullscreen ? 'bg-slate-900 text-white p-6 sm:p-12 min-h-screen flex flex-col justify-between overflow-y-auto' : ''}`}
    >
      {/* Top Controls Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border ${
        isFullscreen ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        {/* Draw Mode Switcher */}
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold uppercase tracking-wider ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
            抽籤規則：
          </span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              id="btn-mode-without-replacement"
              type="button"
              disabled={isRolling}
              onClick={() => setDrawMode('without_replacement')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                drawMode === 'without_replacement'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              不重複抽取
            </button>
            <button
              id="btn-mode-with-replacement"
              type="button"
              disabled={isRolling}
              onClick={() => setDrawMode('with_replacement')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                drawMode === 'with_replacement'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              可重複抽取
            </button>
          </div>
        </div>

        {/* Status indicator & Tools */}
        <div className="flex items-center gap-3">
          {drawMode === 'without_replacement' && (
            <div className={`text-xs px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 ${
              isFullscreen 
                ? 'bg-slate-800 border-slate-700 text-slate-300' 
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
            }`}>
              <Users className="w-3.5 h-3.5" />
              <span>待抽：<strong>{candidateStudents.length}</strong> / 總數：<strong>{students.length}</strong></span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            type="button"
            onClick={handleToggleSound}
            title={isMuted ? '開啟音效' : '靜音'}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isFullscreen 
                ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' 
                : isMuted 
                  ? 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            <span className="hidden sm:inline">{isMuted ? '靜音中' : '音效開啟'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="btn-toggle-fullscreen"
            type="button"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? '退出全螢幕' : '全螢幕投影模式'}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isFullscreen 
                ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? '退出投影' : '投影模式'}</span>
          </button>
        </div>
      </div>

      {/* Main Drawing Stage Area */}
      {students.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">尚未建立學生名單</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            請先切換至「學生名單」分頁匯入 CSV 或貼上名單，即可進行隨機抽籤。
          </p>
          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            {onLoadSample && (
              <button
                id="btn-picker-load-sample"
                onClick={onLoadSample}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                一鍵載入模擬名單（28人）
              </button>
            )}
            <button
              onClick={onSwitchToRoster}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              前往名單設定
            </button>
          </div>
        </div>
      ) : (
        <div 
          id="drawing-stage-card" 
          className={`relative rounded-3xl transition-all border overflow-hidden ${
            isFullscreen 
              ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700 p-8 sm:p-14 my-auto shadow-2xl' 
              : 'bg-gradient-to-b from-indigo-50/70 via-white to-slate-50/60 border-indigo-100/80 p-8 sm:p-12 shadow-sm'
          }`}
        >
          {/* Background decorative circles */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Exhausted State Banner */}
          {isPoolExhausted && (
            <div id="pool-exhausted-banner" className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-900 shadow-xs">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">
                  全班 {students.length} 位同學皆已抽過一輪！
                </span>
              </div>
              <button
                id="btn-reset-pool-top"
                onClick={handleResetPool}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重置名單重新抽
              </button>
            </div>
          )}

          {/* Central Animated Wheel/Card */}
          <div className="flex flex-col items-center justify-center my-4 sm:my-8 text-center">
            {/* Seat badge if present */}
            {displaySeat && (
              <span className={`px-4 py-1 rounded-full text-xs font-bold tracking-wider mb-3 uppercase shadow-xs ${
                isFullscreen 
                  ? 'bg-indigo-600/40 border border-indigo-400 text-indigo-200' 
                  : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
              }`}>
                座號 {displaySeat} 號
              </span>
            )}

            {/* Student Name Box */}
            <div 
              id="drawn-student-display"
              className={`relative px-8 py-6 rounded-3xl transition-all duration-300 flex items-center justify-center min-w-[280px] sm:min-w-[420px] max-w-2xl ${
                isRolling 
                  ? 'scale-105 border-4 border-indigo-500 shadow-xl bg-white/95 text-indigo-950' 
                  : selectedStudent 
                    ? 'scale-110 border-4 border-amber-400 bg-amber-50/90 shadow-2xl text-amber-950 animate-bounce-once' 
                    : isFullscreen 
                      ? 'bg-slate-800/90 border-2 border-slate-700 text-slate-300' 
                      : 'bg-white border-2 border-slate-200 shadow-xs text-slate-700'
              }`}
            >
              <h1 className={`font-black tracking-tight select-none transition-all ${
                isFullscreen 
                  ? 'text-5xl sm:text-7xl md:text-8xl' 
                  : 'text-4xl sm:text-6xl md:text-7xl'
              } ${isRolling ? 'blur-[0.5px] scale-95 text-indigo-600' : ''}`}>
                {displayName}
              </h1>

              {/* Congratulatory Badge when selected */}
              {selectedStudent && !isRolling && (
                <div className="absolute -top-3.5 -right-3.5 w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <Award className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Instruction / feedback tip */}
            <p className={`text-xs mt-6 font-medium ${
              isFullscreen ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {isRolling 
                ? '🎲 正在隨機挑選中，請稍候...' 
                : selectedStudent 
                  ? '🎉 恭喜中選！已登記於下方抽籤紀錄' 
                  : `目前名單共有 ${students.length} 位同學，點擊下方按鈕開始`}
            </p>

            {/* Primary Action Button */}
            <div className="mt-8 flex items-center gap-4">
              <button
                id="btn-start-draw"
                type="button"
                onClick={startDraw}
                disabled={isRolling || isPoolExhausted}
                className={`group relative px-8 sm:px-12 py-4 rounded-2xl font-black text-lg sm:text-xl shadow-lg transition-all transform active:scale-95 flex items-center gap-3 ${
                  isRolling || isPoolExhausted
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5'
                }`}
              >
                <Sparkles className={`w-6 h-6 ${isRolling ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
                <span>{isRolling ? '抽籤進行中...' : '開始抽籤！'}</span>
              </button>

              {drawMode === 'without_replacement' && history.length > 0 && (
                <button
                  id="btn-reset-pool"
                  type="button"
                  disabled={isRolling}
                  onClick={handleResetPool}
                  title="重置名單（清空已抽過名單）"
                  className={`p-4 rounded-2xl border transition-colors ${
                    isFullscreen 
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                  }`}
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History and Pool Status Section (Hidden during full-screen projector or kept neat) */}
      {!isFullscreen && students.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* History Panel (2 cols) */}
          <div id="draw-history-panel" className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">抽籤歷史紀錄</h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold">
                  {history.length} 次
                </span>
              </div>
              {history.length > 0 && (
                <button
                  id="btn-clear-history"
                  onClick={onClearHistory}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  清空紀錄
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                尚未進行抽籤，抽出的學生紀錄將顯示於此。
              </div>
            ) : (
              <div className="mt-3 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {history.slice().reverse().map((item, idx) => {
                  const student = students.find(s => s.id === item.studentId);
                  const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  return (
                    <div key={item.id} className="py-2.5 flex items-center justify-between group hover:bg-slate-50 px-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          #{item.orderNumber}
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 text-sm mr-2">{item.studentName}</span>
                          {student?.seatNumber && (
                            <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              座號 {student.seatNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeStr}
                        </span>
                        <button
                          onClick={() => onRemoveHistoryItem(item.id)}
                          title="移除此條紀錄"
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Remaining Candidates Pool (1 col) */}
          {drawMode === 'without_replacement' ? (
            <div id="candidates-pool-panel" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm">尚未抽中名單</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                    剩餘 {candidateStudents.length} 人
                  </span>
                </div>
                
                {candidateStudents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-emerald-600 font-medium">
                    ✨ 全員皆已抽中！
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1">
                    {candidateStudents.map(student => (
                      <span
                        key={student.id}
                        className="inline-flex items-center px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
                      >
                        {student.seatNumber ? `${student.seatNumber}. ` : ''}{student.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-400">
                不重複模式下，每位同學僅會被抽中一次，直至全數抽完。
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm pb-3 border-b border-slate-100">
                  可重複抽取模式
                </h3>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  目前模式：每次抽籤時，所有學生（共 {students.length} 人）皆具有相同的中選機率。
                </p>
                <div className="mt-4 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
                  若希望每位學生只被抽中一次（例如：輪流上台報告、點名回答），請切換上方「不重複抽取」。
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
