/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Users, 
  Layers, 
  GraduationCap, 
  Volume2, 
  VolumeX, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Student, DrawHistoryRecord } from './types';
import { SAMPLE_STUDENTS } from './utils/csvParser';
import { soundManager } from './utils/audio';
import { RosterManager } from './components/RosterManager';
import { RandomPicker } from './components/RandomPicker';
import { GroupMaker } from './components/GroupMaker';

const STORAGE_KEY_STUDENTS = 'classroom_picker_students_v1';
const STORAGE_KEY_HISTORY = 'classroom_picker_history_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'picker' | 'groups' | 'roster'>('picker');
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    // Default initial roster so the teacher immediately experiences the functionality
    return SAMPLE_STUDENTS;
  });

  const [history, setHistory] = useState<DrawHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Sync students to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    } catch {
      // ignore
    }
  }, [students]);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
  };

  const handleAddHistory = (record: DrawHistoryRecord) => {
    setHistory(prev => [...prev, record]);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleRemoveHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleLoadSampleRoster = () => {
    handleUpdateStudents(SAMPLE_STUDENTS);
    handleClearHistory();
    soundManager.playPing();
  };

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header id="main-header" className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-tight flex items-center gap-2">
                課堂隨機抽籤與分組系統
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                教師專用課堂助手：隨機抽籤 • 動態音效 • 視覺化自動分組
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              id="nav-tab-picker"
              onClick={() => setActiveTab('picker')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'picker'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>隨機抽籤</span>
            </button>

            <button
              id="nav-tab-groups"
              onClick={() => setActiveTab('groups')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'groups'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-violet-500" />
              <span>自動分組</span>
            </button>

            <button
              id="nav-tab-roster"
              onClick={() => setActiveTab('roster')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'roster'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-500" />
              <span>學生名單</span>
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-md text-[10px] font-semibold">
                {students.length}
              </span>
            </button>
          </nav>

          {/* Utility actions */}
          <div className="flex items-center gap-2">
            <button
              id="header-load-sample-btn"
              onClick={handleLoadSampleRoster}
              title="一鍵載入 28 位示範名單快速體驗"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>載入模擬名單</span>
            </button>

            <button
              id="header-sound-btn"
              onClick={toggleSound}
              title={isMuted ? '音效已靜音' : '音效開啟中'}
              className={`p-2 rounded-xl border text-xs transition-colors ${
                isMuted 
                  ? 'bg-slate-100 text-slate-400 border-slate-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            </button>

            <button
              id="header-guide-btn"
              onClick={() => setShowGuideModal(true)}
              title="使用指南"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            history={history}
            onAddHistory={handleAddHistory}
            onClearHistory={handleClearHistory}
            onRemoveHistoryItem={handleRemoveHistoryItem}
            onSwitchToRoster={() => setActiveTab('roster')}
            onLoadSample={handleLoadSampleRoster}
          />
        )}

        {activeTab === 'groups' && (
          <GroupMaker
            students={students}
            onSwitchToRoster={() => setActiveTab('roster')}
            onLoadSample={handleLoadSampleRoster}
          />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            onUpdateStudents={handleUpdateStudents}
            onClearHistory={handleClearHistory}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-400">
        課堂隨機抽籤與分組系統 • 教師課堂教學專用工具 • 支援 CSV 匯入、即時音效與視覺化分組
      </footer>

      {/* Help / Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                教師使用指南
              </h3>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100">
                <p className="font-bold text-indigo-900 mb-1">📁 1. 名單來源與去重功能</p>
                <p>支援 CSV 上傳、直接貼上名單，或從<strong>「模擬名單庫」</strong>一鍵載入 28 人班級或 12 人小班。若名單有重複姓名，系統會自動標記並提供<strong>一鍵移除重複姓名</strong>按鈕！</p>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100">
                <p className="font-bold text-amber-900 mb-1">🎲 2. 隨機抽籤與動畫音效</p>
                <p>抽籤過程伴隨加速再減速的輪盤音效與彩帶動畫。可自由設定<strong>「不重複抽取」</strong>（每位同學抽過一次即排除）或<strong>「可重複抽取」</strong>，並支援大螢幕投影模式。</p>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                <p className="font-bold text-emerald-900 mb-1">🧩 3. 自動分組與 CSV 下載</p>
                <p>可設定每組人數（如 4 人一組），系統自動隨機分配成生動的動物小組，支援組員手動微調、<strong>下載 Excel 相容 CSV 檔案</strong>、下載文字檔與一鍵複製名單。</p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
