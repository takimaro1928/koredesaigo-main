// src/App.js
// ウィジェット管理機能の追加 (完全版 v2)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// lucide-react のインポート
import { Calendar, ChevronLeft, ChevronRight, List, Check, X, AlertTriangle, Info, Search, ChevronsUpDown, BarChart2, Settings as SettingsIcon } from 'lucide-react'; // Settingsアイコンを別名でインポート
// 他のコンポーネントインポート
import QuestionEditModal from './QuestionEditModal';
import AmbiguousTrendsPage from './AmbiguousTrendsPage';
import RedesignedAllQuestionsView from './RedesignedAllQuestionsView';
import TopNavigation from './components/TopNavigation';
import TodayView from './TodayView';
import ScheduleView from './ScheduleView';
import SettingsPage from './SettingsPage';
// import StatsPage from './StatsPage'; // EnhancedStatsPage を使うのでコメントアウト
import ReminderNotification from './ReminderNotification';
import EnhancedStatsPage from './EnhancedStatsPage';
import Dashboard from './components/Dashboard';

// --- IndexedDB ヘルパー関数をインポート ---
import {
  openDB,
  loadSubjects,
  saveSubjects,
  loadAnswerHistory,
  addAnswerHistory,
  saveAnswerHistory, // この行を追加
  clearAllData as dbClearAllData,
  clearAnswerStatus as dbClearAnswerStatus,
  saveSetting,
  loadSetting,
  STORE_HISTORY, // handleDataImport で使用
  STORE_SUBJECTS, // handleFullDataCsvImport で使用
} from './db';

// 問題生成関数
function generateQuestions(prefix, start, end) {
    const questions = [];
    for (let i = start; i <= end; i++) {
        const today = new Date();
        const nextDate = new Date();
        nextDate.setDate(today.getDate() + Math.floor(Math.random() * 30)); // nextDateのランダム性は維持
        questions.push({
            id: `${prefix}${i}`,
            number: i,
            correctRate: Math.floor(Math.random() * 100),
            lastAnswered: new Date(today.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
            nextDate: nextDate.toISOString(),
            // 復習間隔の候補から '2ヶ月' を削除
            interval: ['1日', '3日', '7日', '14日', '1ヶ月'][Math.floor(Math.random() * 5)],
            answerCount: Math.floor(Math.random() * 10),
            understanding: '理解○',
            previousUnderstanding: null,
            comment: '',
        });
    } return questions;
}
// 初期データ生成関数
const generateInitialData = () => {
    console.log("generateInitialData が呼ばれました (サンプルデータ生成)");
    const pastExamSubjectPrefixMap = { "企業経営理論": "企経", "運営管理": "運営", "経済学・経済政策": "経済", "経営情報システム": "情報", "経営法務": "法務", "中小企業経営・政策": "中小", };
    const subjects = [
        // --- 科目 1: 企業経営理論 ---
        { id: 1, subjectId: 1, subjectName: "企業経営理論", chapters: [
            { id: 101, chapterId: 101, chapterName: "企業活動と経営戦略の全体概要 Q1-1", questions: generateQuestions('1-1-', 1, 17) },
            { id: 102, chapterId: 102, chapterName: "経営戦略と経営計画 Q1-2", questions: generateQuestions('1-2-', 1, 27) },
            { id: 103, chapterId: 103, chapterName: "経営組織とリーダーシップ Q1-3", questions: generateQuestions('1-3-', 1, 14) },
            { id: 104, chapterId: 104, chapterName: "経営管理の手法と技術 Q1-4", questions: generateQuestions('1-4-', 1, 22) },
            { id: 105, chapterId: 105, chapterName: "人的資源管理と組織行動 Q1-5", questions: generateQuestions('1-5-', 1, 18) },
            { id: 106, chapterId: 106, chapterName: "モチベーションとコミュニケーション Q1-6", questions: generateQuestions('1-6-', 1, 12) },
            { id: 107, chapterId: 107, chapterName: "企業文化と組織変革 Q1-7", questions: generateQuestions('1-7-', 1, 10) },
            { id: 108, chapterId: 108, chapterName: "経営情報システムとDX Q1-8", questions: generateQuestions('1-8-', 1, 15) },
            { id: 109, chapterId: 109, chapterName: "グローバル経営と国際戦略 Q1-9", questions: generateQuestions('1-9-', 1, 11) },
            { id: 110, chapterId: 110, chapterName: "経営倫理とCSR Q1-10", questions: generateQuestions('1-10-', 1, 9) },
        ] },
        // --- 科目 2: 運営管理 ---
        { id: 2, subjectId: 2, subjectName: "運営管理", chapters: [ { id: 201, chapterId: 201, chapterName: "生産管理概論 Q1-1", questions: generateQuestions('2-1-1-', 1, 10) }, { id: 202, chapterId: 202, chapterName: "生産のプランニング Q1-2", questions: generateQuestions('2-1-2-', 1, 52) }, { id: 203, chapterId: 203, chapterName: "生産のオペレーション Q1-3", questions: generateQuestions('2-1-3-', 1, 35) }, { id: 204, chapterId: 204, chapterName: "製造業における情報システム Q1-4", questions: generateQuestions('2-1-4-', 1, 6) }, { id: 205, chapterId: 205, chapterName: "店舗・商業集積 Q2-1", questions: generateQuestions('2-2-1-', 1, 9) }, { id: 206, chapterId: 206, chapterName: "商品仕入・販売（マーチャンダイジング） Q2-2", questions: generateQuestions('2-2-2-', 1, 23) }, { id: 207, chapterId: 207, chapterName: "物流・輸配送管理 Q2-3", questions: generateQuestions('2-2-3-', 1, 18) }, { id: 208, chapterId: 208, chapterName: "販売流通情報システム Q2-4", questions: generateQuestions('2-2-4-', 1, 17) } ] },
        // --- 科目 3: 経済学 ---
        { id: 3, subjectId: 3, subjectName: "経済学", chapters: [ { id: 301, chapterId: 301, chapterName: "企業行動の分析 Q1", questions: generateQuestions('3-1-', 1, 19) }, { id: 302, chapterId: 302, chapterName: "消費者行動の分析 Q2", questions: generateQuestions('3-2-', 1, 22) }, { id: 303, chapterId: 303, chapterName: "市場均衡と厚生分析 Q3", questions: generateQuestions('3-3-', 1, 23) }, { id: 304, chapterId: 304, chapterName: "不完全競争 Q4", questions: generateQuestions('3-4-', 1, 15) }, { id: 305, chapterId: 305, chapterName: "市場の失敗と政府の役割 Q5", questions: generateQuestions('3-5-', 1, 15) }, { id: 306, chapterId: 306, chapterName: "国民経済計算と主要経済指標 Q6", questions: generateQuestions('3-6-', 1, 13) }, { id: 307, chapterId: 307, chapterName: "財市場の分析 Q7", questions: generateQuestions('3-7-', 1, 11) }, { id: 308, chapterId: 308, chapterName: "貨幣市場とIS-LM分析 Q8", questions: generateQuestions('3-8-', 1, 14) }, { id: 309, chapterId: 309, chapterName: "雇用と物価水準 Q9", questions: generateQuestions('3-9-', 1, 8) }, { id: 310, chapterId: 310, chapterName: "消費、投資、財政金融政策に関する理論 Q10", questions: generateQuestions('3-10-', 1, 11) }, { id: 311, chapterId: 311, chapterName: "国際マクロ経済 Q11", questions: generateQuestions('3-11-', 1, 6) }, { id: 312, chapterId: 312, chapterName: "景気循環と経済成長 Q12", questions: generateQuestions('3-12-', 1, 3) } ] },
        // --- 科目 4: 経営情報システム ---
        { id: 4, subjectId: 4, subjectName: "経営情報システム", chapters: [ { id: 401, chapterId: 401, chapterName: "情報技術に関する基礎知識 Q1", questions: generateQuestions('4-1-', 1, 178) }, { id: 402, chapterId: 402, chapterName: "ソフトウェア開発 Q2", questions: generateQuestions('4-2-', 1, 38) }, { id: 403, chapterId: 403, chapterName: "経営情報管理 Q3", questions: generateQuestions('4-3-', 1, 35) }, { id: 404, chapterId: 404, chapterName: "統計解析 Q4", questions: generateQuestions('4-4-', 1, 9) } ] },
        // --- 科目 5: 経営法務 ---
        { id: 5, subjectId: 5, subjectName: "経営法務", chapters: [ { id: 501, chapterId: 501, chapterName: "民法その他の知識 Q1", questions: generateQuestions('5-1-', 1, 54) }, { id: 502, chapterId: 502, chapterName: "会社法等に関する知識 Q2", questions: generateQuestions('5-2-', 1, 123) }, { id: 503, chapterId: 503, chapterName: "資本市場に関する知識 Q3", questions: generateQuestions('5-3-', 1, 12) }, { id: 504, chapterId: 504, chapterName: "倒産等に関する知識 Q4", questions: generateQuestions('5-4-', 1, 16) }, { id: 505, chapterId: 505, chapterName: "知的財産権等に関する知識 Q5", questions: generateQuestions('5-5-', 1, 107) }, { id: 506, chapterId: 506, chapterName: "その他経営法務に関する知識 Q6", questions: generateQuestions('5-6-', 1, 19) } ] },
        // --- 科目 6: 中小企業経営・政策 ---
        { id: 6, subjectId: 6, subjectName: "中小企業経営・中小企業政策", chapters: [ { id: 601, chapterId: 601, chapterName: "中小企業経営/中小企業概論 Q1-1", questions: generateQuestions('6-1-1-', 1, 31) }, { id: 602, chapterId: 602, chapterName: "中小企業経営/令和5年度の中小企業の動向 Q1-2", questions: generateQuestions('6-1-2-', 1, 40) }, { id: 603, chapterId: 603, chapterName: "中小企業経営/環境変化に対応する中小企業 Q1-3", questions: generateQuestions('6-1-3-', 1, 14) }, { id: 604, chapterId: 604, chapterName: "中小企業経営/経営課題に立ち向かう小規模業者業 Q1-4", questions: generateQuestions('6-1-4-', 1, 32) }, { id: 605, chapterId: 605, chapterName: "中小企業政策/中小企業政策の基本 Q2-1", questions: generateQuestions('6-2-1-', 1, 14) }, { id: 606, chapterId: 606, chapterName: "中小企業政策/中小企業施策 Q2-2", questions: generateQuestions('6-2-2-', 1, 68) }, { id: 607, chapterId: 607, chapterName: "中小企業政策/中小企業政策の変遷 Q2-3", questions: generateQuestions('6-2-3-', 1, 1) } ] },
        // --- 科目 7: 過去問題集 ---
        { id: 7, subjectId: 7, subjectName: "過去問題集", chapters: [ { id: 701, chapterId: 701, chapterName: "企業経営理論 令和6年度", questionCount: 40 }, { id: 702, chapterId: 702, chapterName: "企業経営理論 令和5年度", questionCount: 37 }, { id: 703, chapterId: 703, chapterName: "企業経営理論 令和4年度", questionCount: 37 }, { id: 704, chapterId: 704, chapterName: "企業経営理論 令和3年度", questionCount: 38 }, { id: 705, chapterId: 705, chapterName: "企業経営理論 令和2年度", questionCount: 36 }, { id: 706, chapterId: 706, chapterName: "運営管理 令和6年度", questionCount: 41 }, { id: 707, chapterId: 707, chapterName: "運営管理 令和5年度", questionCount: 37 }, { id: 708, chapterId: 708, chapterName: "運営管理 令和4年度", questionCount: 39 }, { id: 709, chapterId: 709, chapterName: "運営管理 令和3年度", questionCount: 41 }, { id: 710, chapterId: 710, chapterName: "運営管理 令和2年度", questionCount: 42 }, { id: 711, chapterId: 711, chapterName: "経済学・経済政策 令和6年度", questionCount: 22 }, { id: 712, chapterId: 712, chapterName: "経済学・経済政策 令和5年度", questionCount: 22 }, { id: 713, chapterId: 713, chapterName: "経済学・経済政策 令和4年度", questionCount: 21 }, { id: 714, chapterId: 714, chapterName: "経済学・経済政策 令和3年度", questionCount: 23 }, { id: 715, chapterId: 715, chapterName: "経済学・経済政策 令和2年度", questionCount: 22 }, { id: 716, chapterId: 716, chapterName: "経営情報システム 令和6年度", questionCount: 23 }, { id: 717, chapterId: 717, chapterName: "経営情報システム 令和5年度", questionCount: 25 }, { id: 718, chapterId: 718, chapterName: "経営情報システム 令和4年度", questionCount: 24 }, { id: 719, chapterId: 719, chapterName: "経営情報システム 令和3年度", questionCount: 25 }, { id: 720, chapterId: 720, chapterName: "経営情報システム 令和2年度", questionCount: 25 }, { id: 721, chapterId: 721, chapterName: "経営法務 令和6年度", questionCount: 24 }, { id: 722, chapterId: 722, chapterName: "経営法務 令和5年度", questionCount: 21 }, { id: 723, chapterId: 723, chapterName: "経営法務 令和4年度", questionCount: 22 }, { id: 724, chapterId: 724, chapterName: "経営法務 令和3年度", questionCount: 20 }, { id: 725, chapterId: 725, chapterName: "経営法務 令和2年度", questionCount: 22 }, { id: 726, chapterId: 726, chapterName: "中小企業経営・政策 令和6年度", questionCount: 11 }, { id: 727, chapterId: 727, chapterName: "中小企業経営・政策 令和5年度", questionCount: 22 }, { id: 728, chapterId: 728, chapterName: "中小企業経営・政策 令和4年度", questionCount: 22 }, { id: 729, chapterId: 729, chapterName: "中小企業経営・政策 令和3年度", questionCount: 22 }, { id: 730, chapterId: 730, chapterName: "中小企業経営・政策 令和2年度", questionCount: 22 }, ].map(chapterInfo => { const yearMatch = chapterInfo.chapterName.match(/令和(\d+)年度/); const subjectMatch = chapterInfo.chapterName.match(/^(.+?)\s+令和/); if (yearMatch && subjectMatch) { const year = `R${yearMatch[1].padStart(2, '0')}`; const subjectName = subjectMatch[1]; const prefixBase = pastExamSubjectPrefixMap[subjectName] || subjectName.replace(/[・/]/g, ''); const prefix = `過去問-${year}-${prefixBase}-`; return { id: chapterInfo.id, chapterId: chapterInfo.chapterId, chapterName: chapterInfo.chapterName, questions: generateQuestions(prefix, 1, chapterInfo.questionCount) }; } else { console.warn(`Could not parse year/subject from chapter name: ${chapterInfo.chapterName}`); return { id: chapterInfo.id, chapterId: chapterInfo.chapterId, chapterName: chapterInfo.chapterName, questions: [] }; } }) }
    ];
    subjects.forEach((s) => { s.subjectId = s.id; s.chapters.forEach((c) => { c.chapterId = c.id; }); });
    return subjects;
};

// --- 利用可能なウィジェットの定義 ---
const availableWidgets = [
  { id: 'understanding', name: '理解度分布', description: '問題全体の理解度の割合を表示します。' },
  { id: 'progress', name: '科目別進捗', description: '科目ごとの学習進捗率を表示します。' },
  { id: 'weakpoints', name: '苦手問題 TOP5', description: '正解率が低く、解答回数が多い問題を表示します。' },
  { id: 'upcoming', name: '今後の復習予定', description: '直近7日間の復習予定を表示します。' },
  { id: 'calendar', name: '学習カレンダー', description: '日々の解答数をカレンダー形式で表示します。' },
  { id: 'todaySummary', name: '今日やるべきこと', description: '今日の問題数や復習予定を集約します。', isNew: true },
  { id: 'timeAnalysis', name: '時間帯別分析', description: '学習する時間帯の傾向を分析します。', isNew: true },
  { id: 'recentAnswers', name: '最近解答した問題', description: '直近で解答した問題のリストを表示します。', isNew: true },
  { id: 'understandingTrend', name: '理解度別 問題数推移', description: '理解度ごとの問題数の推移を表示します。', isNew: true },
];

// --- デフォルトで表示するウィジェット ---
const defaultActiveWidgets = ['understanding', 'progress', 'weakpoints', 'upcoming', 'calendar'];

// ヘルパー関数 (Appコンポーネントの外)
const parseCsvLineToArray = (line) => {
    const values = [];
    let currentField = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
            if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
                currentField += '"'; 
                j++; 
            } else {
                inQuotes = !inQuotes; 
            }
        } else if (char === ',' && !inQuotes) { 
            values.push(currentField); 
            currentField = '';
        } else {
            currentField += char; 
        }
    }
    values.push(currentField); 
    return values.map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
};

// --- UUID v4 生成ヘルパー ---
const uuidv4 = () => {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // フォールバック: より単純なID生成 (RFC4122準拠ではないが、ユニーク性はそこそこ期待できる)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- App コンポーネント本体 ---
function App() {
  // --- State定義 ---
  const [subjects, setSubjects] = useState(() => {
    const savedSubjects = localStorage.getItem('studySchedulerData');
    return savedSubjects ? JSON.parse(savedSubjects) : [];
  });
  const [answerHistory, setAnswerHistory] = useState(() => {
    const savedAnswerHistory = localStorage.getItem('answerHistory');
    return savedAnswerHistory ? JSON.parse(savedAnswerHistory) : [];
  });
  const [activeTab, setActiveTab] = useState('today');
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showExportReminder, setShowExportReminder] = useState(false);
  const [daysSinceLastExport, setDaysSinceLastExport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardLayouts, setDashboardLayouts] = useState(null);
  const [activeWidgets, setActiveWidgets] = useState(null);

  // --- ヘルパー関数 ---
  const naturalSortCompare = useCallback((a, b) => {
    if (a == null && b == null) return 0; if (a == null) return -1; if (b == null) return 1;
    const ax = [], bx = [];
    String(a).replace(/(\d+)|(\D+)/g, (_, $1, $2) => { ax.push([$1 || Infinity, $2 || ""]) });
    String(b).replace(/(\d+)|(\D+)/g, (_, $1, $2) => { bx.push([$1 || Infinity, $2 || ""]) });
    while (ax.length && bx.length) {
      const an = ax.shift(); const bn = bx.shift();
      const nn = (parseInt(an[0]) - parseInt(bn[0])) || an[1].localeCompare(bn[1], undefined, { numeric: true, sensitivity: 'base' });
      if (nn) return nn;
    }
    return ax.length - bx.length;
  }, []);

  const calculateCorrectRate = useCallback((question, isCorrect) => {
    const currentCount = question?.answerCount ?? 0;
    const validCurrentCount = (typeof currentCount === 'number' && !isNaN(currentCount)) ? currentCount : 0;
    const currentRate = question?.correctRate ?? 0;
    const validCurrentRate = (typeof currentRate === 'number' && !isNaN(currentRate)) ? currentRate : 0;
    if (validCurrentCount === 0) { return isCorrect ? 100 : 0; }
    const totalCorrectPoints = validCurrentRate * validCurrentCount / 100;
    const newRate = isCorrect ? ((totalCorrectPoints + 1) / (validCurrentCount + 1)) * 100 : (totalCorrectPoints / (validCurrentCount + 1)) * 100;
    return Math.round(newRate);
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return '----/--/--';
    try { const d = (date instanceof Date) ? date : new Date(date); if (isNaN(d.getTime())) return '無効日付'; const year = d.getFullYear(); const month = d.getMonth() + 1; const day = d.getDate(); return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`; } catch(e) { console.error("formatDateエラー:", e, date); return 'エラー'; }
  }, []);

  // --- データロード処理 ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      console.log("IndexedDB: Loading initial data...");
      try {
        const [loadedSubjects, loadedHistory, savedLayouts, savedActiveWidgets] = await Promise.all([
          loadSubjects(), loadAnswerHistory(), loadSetting('dashboardLayouts'), loadSetting('activeWidgets')
        ]);

        if (loadedSubjects && loadedSubjects.length > 0) {
          setSubjects(loadedSubjects); console.log('IndexedDB: 学習データを読み込み完了');
          const initialExpandedSubjectsState = {};
          loadedSubjects.forEach(subject => { if (subject?.id) { initialExpandedSubjectsState[subject.id] = false; } });
          if (loadedSubjects.length > 0 && loadedSubjects[0]?.id) { initialExpandedSubjectsState[loadedSubjects[0].id] = true; }
          setExpandedSubjects(initialExpandedSubjectsState);
        } else {
          console.log('IndexedDB: No data found, generating initial data...');
          const initialSubjects = generateInitialData(); await saveSubjects(initialSubjects); setSubjects(initialSubjects); console.log('IndexedDB: 初期学習データを生成・保存しました');
          const initialExpandedSubjectsState = {};
          initialSubjects.forEach(subject => { if (subject?.id) { initialExpandedSubjectsState[subject.id] = false; } });
          if (initialSubjects.length > 0 && initialSubjects[0]?.id) { initialExpandedSubjectsState[initialSubjects[0].id] = true; }
          setExpandedSubjects(initialExpandedSubjectsState);
        }
        setAnswerHistory(loadedHistory || []); console.log('IndexedDB: 解答履歴読み込み完了');

        if (savedLayouts) { setDashboardLayouts(savedLayouts); console.log("IndexedDB: Dashboard layout loaded."); }
        else { console.log("IndexedDB: No saved dashboard layout found."); }

        if (savedActiveWidgets && Array.isArray(savedActiveWidgets)) {
            setActiveWidgets(savedActiveWidgets); console.log("IndexedDB: Active widgets loaded:", savedActiveWidgets);
        } else {
            setActiveWidgets(defaultActiveWidgets); console.log("IndexedDB: No saved active widgets found, using default.");
        }

      } catch (error) {
        console.error('IndexedDB: Failed to load data:', error);
        const initialSubjects = generateInitialData(); setSubjects(initialSubjects); setAnswerHistory([]);
        const initialExpandedSubjectsState = {};
        initialSubjects.forEach(subject => { if (subject?.id) { initialExpandedSubjectsState[subject.id] = false; } });
        if (initialSubjects.length > 0 && initialSubjects[0]?.id) { initialExpandedSubjectsState[initialSubjects[0].id] = true; }
        setExpandedSubjects(initialExpandedSubjectsState); setDashboardLayouts(null);
        setActiveWidgets(defaultActiveWidgets);
      } finally {
        setIsLoading(false); console.log("IndexedDB: Initial data loading process finished.");
      }
    };
    loadData();
  }, []);

  // --- データ変更時の保存処理 ---
  useEffect(() => {
    if (subjects && subjects.length > 0 && !isLoading) {
      saveSubjects(subjects)
        .catch(error => console.error("IndexedDB: Failed to save subjects data:", error));
    }
  }, [subjects, isLoading]);

  // --- リマインダーチェック ---
  useEffect(() => {
    const checkExportReminder = async () => {
      if (isLoading) return;
      try {
          const lastExportTimestamp = await loadSetting('lastExportTimestamp');
          const reminderDismissedTimestamp = await loadSetting('reminderDismissedTimestamp');
          const now = new Date().getTime(); const dismissedTime = reminderDismissedTimestamp ? parseInt(reminderDismissedTimestamp, 10) : 0;
          if (!isNaN(dismissedTime)) { const dismissedDaysAgo = Math.floor((now - dismissedTime) / (1000 * 60 * 60 * 24)); if (dismissedDaysAgo < 3) { setShowExportReminder(false); return; } }
          else { console.warn("Invalid reminderDismissedTimestamp found in DB."); }
          if (!lastExportTimestamp) { setDaysSinceLastExport(null); setShowExportReminder(true); }
          else { const lastExportTime = parseInt(lastExportTimestamp, 10);
               if (!isNaN(lastExportTime)) { const daysSinceExport = Math.floor((now - lastExportTime) / (1000 * 60 * 60 * 24)); if (daysSinceExport >= 14) { setDaysSinceLastExport(daysSinceExport); setShowExportReminder(true); } else { setShowExportReminder(false); } }
               else { console.warn("Invalid lastExportTimestamp found in DB."); setDaysSinceLastExport(null); setShowExportReminder(true); } }
      } catch (error) { console.error("Error checking export reminder:", error); }
    };
    if (!isLoading) { checkExportReminder(); }
  }, [isLoading]);

  // --- useMemo による計算 ---
  const todayQuestionsList = useMemo(() => {
    if (isLoading || !Array.isArray(subjects) || subjects.length === 0) return [];
    const today = new Date(); today.setHours(0, 0, 0, 0); const todayTime = today.getTime();
    const questions = [];
    subjects.forEach((subject) => {
      if (!subject || !Array.isArray(subject.chapters)) return;
      const currentSubjectName = subject.subjectName || subject.name || '?';
      subject.chapters.forEach((chapter) => {
        if (!chapter || !Array.isArray(chapter.questions)) return;
        const currentChapterName = chapter.chapterName || chapter.name || '?';
        chapter.questions.forEach(question => {
            if (!question?.nextDate) return;
            try { const nextDate = new Date(question.nextDate); if (isNaN(nextDate.getTime())) return; nextDate.setHours(0, 0, 0, 0);
                if (nextDate.getTime() === todayTime) { questions.push({ ...question, subjectName: currentSubjectName, chapterName: currentChapterName, name: question.name || question.id }); }
            } catch (e) { console.error("[Today - useMemo] Error processing question:", e, question); }
        });
      });
    });
    return questions.sort((a, b) => naturalSortCompare(a.id, b.id));
  }, [subjects, isLoading, naturalSortCompare]);

  // --- getQuestionsForDate ---
  const getQuestionsForDate = useCallback((date) => {
    if (isLoading || !Array.isArray(subjects) || subjects.length === 0) return [];
    const targetDate = new Date(date); if (isNaN(targetDate.getTime())) return []; targetDate.setHours(0, 0, 0, 0); const targetTime = targetDate.getTime();
    const questions = [];
    subjects.forEach((subject) => {
        if (!subject || !Array.isArray(subject.chapters)) return;
        const currentSubjectName = subject.subjectName || subject.name || '?';
        subject.chapters.forEach((chapter) => {
            if (!chapter || !Array.isArray(chapter.questions)) return;
            const currentChapterName = chapter.chapterName || chapter.name || '?';
            chapter.questions.forEach(question => {
                if (!question?.nextDate) return;
                try { const nextDate = new Date(question.nextDate); if (isNaN(nextDate.getTime())) return; nextDate.setHours(0, 0, 0, 0);
                    if (nextDate.getTime() === targetTime) { questions.push({ ...question, subjectName: currentSubjectName, chapterName: currentChapterName, name: question.name || question.id }); }
                } catch(e) { console.error(`Error processing question in getQuestionsForDate (${formatDate(date)}):`, e, question); }
            });
        });
    });
    return questions.sort((a, b) => naturalSortCompare(a.id, b.id));
  }, [subjects, isLoading, naturalSortCompare, formatDate]);

  // --- アコーディオン開閉 ---
  const toggleSubject = (subjectId) => { setExpandedSubjects(prev => ({ ...prev, [subjectId]: !prev[subjectId] })); };
  const toggleChapter = (chapterId) => { setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] })); };

  // --- 解答記録 & 履歴追加 ---
  const recordAnswer = useCallback(async (questionId, isCorrect, understanding) => {
    const timestamp = new Date().toISOString();
    let updatedQuestionData = null;
    setSubjects(prevSubjects => {
      if (!Array.isArray(prevSubjects)) return [];
      return prevSubjects.map(subject => {
        if (!subject?.chapters) return subject;
        return { ...subject, chapters: subject.chapters.map(chapter => {
          if (!chapter?.questions) return chapter;
          return { ...chapter, questions: chapter.questions.map(q => {
            if (q?.id === questionId) {
              const question = { ...q }; const previousUnderstanding = question.understanding; const today = new Date(); let nextDate = new Date(); let newInterval = '';
              if (understanding.startsWith('曖昧△')) { nextDate.setDate(today.getDate() + 8); newInterval = '8日'; } 
              else if (isCorrect && understanding === '理解○') { 
                const isFirstCorrect = question.understanding === '未学習'; 
                const baseInterval = isFirstCorrect ? '1日' : (previousUnderstanding?.startsWith('曖昧△') ? '14日' : (question.interval || '1日')); 
                switch(baseInterval) { 
                  case '1日': nextDate.setDate(today.getDate() + 3); newInterval = '3日'; break; 
                  case '3日': nextDate.setDate(today.getDate() + 7); newInterval = '7日'; break; 
                  case '7日': nextDate.setDate(today.getDate() + 14); newInterval = '14日'; break; 
                  case '14日': nextDate.setMonth(today.getMonth() + 1); newInterval = '1ヶ月'; break; 
                  // '1ヶ月' の次は '1ヶ月' のまま (最大1ヶ月)
                  case '1ヶ月': nextDate.setMonth(today.getMonth() + 1); newInterval = '1ヶ月'; break; 
                  // default の場合も最大 '1ヶ月'
                  default: nextDate.setMonth(today.getMonth() + 1); newInterval = '1ヶ月'; break; 
                } 
              } else { 
                nextDate.setDate(today.getDate() + 1); newInterval = '1日'; 
              }
              updatedQuestionData = { ...question, lastAnswered: today, nextDate: nextDate.toISOString(), interval: newInterval, answerCount: (question.answerCount || 0) + 1, understanding: understanding, previousUnderstanding: previousUnderstanding, correctRate: calculateCorrectRate(question, isCorrect) };
              return updatedQuestionData;
            } return q; }) }; }) };
      });
    });
    if (updatedQuestionData) {
      const historyId = crypto.randomUUID ? crypto.randomUUID() : `history-${Date.now()}-${Math.random()}`;
      const newHistoryRecord = { id: historyId, questionId: questionId, timestamp: timestamp, isCorrect: isCorrect, understanding: understanding };
      try { await addAnswerHistory(newHistoryRecord); console.log("IndexedDB: Answer history added."); setAnswerHistory(prevHistory => [...prevHistory, newHistoryRecord]); } catch (error) { console.error("IndexedDB: Failed to add answer history:", error); }
    } else { console.warn("recordAnswer: Failed to find question or update data for", questionId); }
  }, [calculateCorrectRate]);

  // --- コメント保存 ---
  const saveComment = useCallback((questionId, commentText) => {
    setSubjects(prevSubjects => {
      if (!Array.isArray(prevSubjects)) return [];
      return prevSubjects.map(subject => {
        if (!subject?.chapters) return subject;
        return { ...subject, chapters: subject.chapters.map(chapter => {
            if (!chapter?.questions) return chapter;
            return { ...chapter, questions: chapter.questions.map(q => q?.id === questionId ? { ...q, comment: commentText } : q) }; }) };
      });
    });
  }, []);

  // --- DnD 日付変更 ---
  const handleQuestionDateChange = useCallback((questionId, newDate) => {
    setSubjects(prevSubjects => {
      if (!Array.isArray(prevSubjects)) return [];
      const targetDate = new Date(newDate); if (isNaN(targetDate.getTime())) { console.error("無効日付:", newDate); return prevSubjects; } targetDate.setHours(0, 0, 0, 0); const targetDateString = targetDate.toISOString();
      return prevSubjects.map(subject => {
        if (!subject?.chapters) return subject;
        return { ...subject, chapters: subject.chapters.map(chapter => {
            if (!chapter?.questions) return chapter;
            return { ...chapter, questions: chapter.questions.map(q => q?.id === questionId ? { ...q, nextDate: targetDateString } : q) }; }) };
      });
    });
  }, []);

  // --- 個別編集保存 ---
  const saveQuestionEdit = useCallback((questionData) => {
    console.log("編集保存 (App.js):", questionData);
    setSubjects(prevSubjects => {
      if (!Array.isArray(prevSubjects)) return [];
      return prevSubjects.map(subject => {
        if (!subject?.chapters) return subject;
        return { ...subject, chapters: subject.chapters.map(chapter => {
            if (!chapter?.questions) return chapter;
            return { ...chapter, questions: chapter.questions.map(q => {
                if (q?.id === questionData.id) {
                  const updatedQuestion = { ...q, ...questionData, lastAnswered: questionData.lastAnswered ? new Date(questionData.lastAnswered) : null, nextDate: questionData.nextDate ? new Date(questionData.nextDate).toISOString() : null };
                   if (updatedQuestion.nextDate && isNaN(new Date(updatedQuestion.nextDate).getTime())) { updatedQuestion.nextDate = q.nextDate; }
                   if (updatedQuestion.lastAnswered && isNaN(updatedQuestion.lastAnswered?.getTime())) { updatedQuestion.lastAnswered = null; }
                   if (typeof updatedQuestion.answerCount !== 'number' || isNaN(updatedQuestion.answerCount) || updatedQuestion.answerCount < 0) { updatedQuestion.answerCount = 0; }
                   if (typeof updatedQuestion.correctRate !== 'number' || isNaN(updatedQuestion.correctRate) || updatedQuestion.correctRate < 0 || updatedQuestion.correctRate > 100) { updatedQuestion.correctRate = 0;}
                  return updatedQuestion;
                } return q; }) }; }) };
      });
    });
    setEditingQuestion(null);
  }, []);

  // --- 一括編集保存 ---
  const saveBulkEdit = useCallback((date) => {
    console.log("一括編集実行 (App.js):", date, "対象:", selectedQuestions);
    if (!selectedQuestions || selectedQuestions.length === 0) { alert('一括編集する問題を選択してください。'); return; } if (!date) { alert('一括設定する日付を選択してください。'); return; }
    const targetDate = new Date(date); if (isNaN(targetDate.getTime())) { console.error("無効日付:", date); alert('無効な日付が選択されています。'); return; } targetDate.setHours(0, 0, 0, 0); const targetDateString = targetDate.toISOString(); let updatedCount = 0;
    setSubjects(prevSubjects => {
      if (!Array.isArray(prevSubjects)) return [];
      const newSubjects = prevSubjects.map(subject => {
        if (!subject?.chapters) return subject;
        return { ...subject, chapters: subject.chapters.map(chapter => {
            if (!chapter?.questions) return chapter;
            return { ...chapter, questions: chapter.questions.map(q => { if (q && selectedQuestions.includes(q.id)) { updatedCount++; return { ...q, nextDate: targetDateString }; } return q; }) }; }) };
      });
       if (updatedCount > 0) { alert(`${updatedCount}件の問題の次回解答日を ${formatDate(targetDate)} に設定しました。`); }
      return newSubjects;
    });
    setBulkEditMode(false); setSelectedQuestions([]); setSelectedDate(null); console.log("一括編集完了");
  }, [selectedQuestions, formatDate]);

  // --- 一括編集 選択切り替え ---
  const toggleQuestionSelection = useCallback((questionId) => {
    setSelectedQuestions(prev => prev.includes(questionId) ? prev.filter(id => id !== questionId) : [...prev, questionId]);
  }, []);

  // --- 完全リセット関数 ---
  const resetAllData = useCallback(async () => {
    console.log("全学習データのリセットを実行します...");
    if (window.confirm("本当にすべての学習データ（解答履歴含む）をリセットしますか？\nこの操作は元に戻せません。")) {
      setIsLoading(true);
      try { await dbClearAllData(); await saveSetting('lastExportTimestamp', null); await saveSetting('reminderDismissedTimestamp', null); console.log("IndexedDBのデータを削除しました。"); alert("学習データをリセットしました。ページをリロードして初期データを再生成します。"); window.location.reload(); } catch (error) { console.error("データリセット中にエラーが発生しました:", error); alert("データのリセット中にエラーが発生しました。"); setIsLoading(false); }
    } else { console.log("データリセットはキャンセルされました。"); }
  }, []);

  // --- 回答状況のみリセット関数 ---
  const resetAnswerStatusOnly = useCallback(async () => {
    console.log("回答状況のみリセットを実行します...");
    if (window.confirm("問題リストを維持したまま、全ての回答状況（正解率・理解度・次回解答日など）をリセットしますか？\nこの操作は元に戻せません。")) {
       setIsLoading(true);
      try { await dbClearAnswerStatus(); const currentSubjects = await loadSubjects(); setSubjects(currentSubjects); setAnswerHistory([]); alert("回答状況をリセットしました。問題リストは維持されています。"); } catch (error) { console.error("回答状況リセット中にエラーが発生しました:", error); alert("回答状況のリセット中にエラーが発生しました。"); } finally { setIsLoading(false); }
    } else { console.log("回答状況リセットはキャンセルされました。"); }
  }, []);

  // --- データインポート ---
  const handleDataImport = useCallback(async (importedData) => {
    console.log("インポートデータ処理関数が呼ばれました:", importedData);
    if (!window.confirm("データをインポートすると、現在のデータは上書きされます。続行しますか？")) { console.log("インポートがキャンセルされました"); return false; }
    setIsLoading(true);
    try {
      if (!importedData || typeof importedData !== 'object') { console.error("無効なインポートデータ形式です"); alert("無効なファイル形式です。"); setIsLoading(false); return false; }
      if (Array.isArray(importedData.subjects)) {
        const processedSubjects = importedData.subjects.map(subject => {
          if (subject.name && !subject.subjectName) subject.subjectName = subject.name; if (subject.subjectName && !subject.name) subject.name = subject.subjectName; if (!subject.subjectId && subject.id) subject.subjectId = subject.id;
          if (Array.isArray(subject.chapters)) {
            subject.chapters = subject.chapters.map(chapter => {
              if (chapter.name && !chapter.chapterName) chapter.chapterName = chapter.name; if (chapter.chapterName && !chapter.name) chapter.name = chapter.chapterName; if (!chapter.chapterId && chapter.id) chapter.chapterId = chapter.id;
              if (Array.isArray(chapter.questions)) {
                chapter.questions = chapter.questions.map(q => {
                  if (q.lastAnswered && !(q.lastAnswered instanceof Date)) { const parsedDate = new Date(q.lastAnswered); q.lastAnswered = !isNaN(parsedDate.getTime()) ? parsedDate : null; }
                  if (typeof q.understanding === 'undefined') q.understanding = '理解○'; if (typeof q.comment === 'undefined') q.comment = '';
                  return q; }); } return chapter; }); } return subject; });
        await saveSubjects(processedSubjects); setSubjects(processedSubjects); console.log("IndexedDB: 科目データをインポート・保存しました:", processedSubjects.length, "件");
      } else { console.warn("インポートデータに科目情報がありません"); }
      if (Array.isArray(importedData.answerHistory)) {
         const db = await openDB(); const transaction = db.transaction([STORE_HISTORY], 'readwrite'); const store = transaction.objectStore(STORE_HISTORY);
         await new Promise((resolve, reject) => { const clearReq = store.clear(); clearReq.onsuccess = resolve; clearReq.onerror = reject; });
         for (const record of importedData.answerHistory) {
             const historyId = record.id || (crypto.randomUUID ? crypto.randomUUID() : `history-${Date.now()}-${Math.random()}`);
             await new Promise((resolve, reject) => {
                 const addReq = store.add({...record, id: historyId});
                 addReq.onsuccess = resolve;
                 addReq.onerror = (e) => { console.error(`Error adding history record (ID: ${historyId}):`, e.target.error); reject(e.target.error); };
             });
         }
        setAnswerHistory(importedData.answerHistory); console.log("IndexedDB: 解答履歴をインポート・保存しました:", importedData.answerHistory.length, "件");
      } else {
        console.warn("インポートデータに解答履歴がありません");
        const db = await openDB(); const transaction = db.transaction([STORE_HISTORY], 'readwrite');
        await new Promise((resolve, reject) => { const clearReq = transaction.objectStore(STORE_HISTORY).clear(); clearReq.onsuccess = resolve; clearReq.onerror = reject; });
        setAnswerHistory([]); }
      alert("データのインポートが完了しました。"); return true;
    } catch (error) { console.error("データインポート処理中にエラー:", error); alert(`データのインポート中にエラーが発生しました: ${error.message}`); return false; } finally { setIsLoading(false); }
  }, []);

  // --- データエクスポート ---
  const handleDataExport = useCallback(async () => {
    setIsLoading(true);
    try {
      const subjectsToExport = await loadSubjects(); const historyToExport = await loadAnswerHistory();
      const exportData = { exportDate: new Date().toISOString(), appVersion: "1.1.0-indexeddb", subjects: subjectsToExport, answerHistory: historyToExport };
      const jsonString = JSON.stringify(exportData, null, 2); const blob = new Blob([jsonString], { type: 'application/json' }); const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; const dateStr = new Date().toISOString().split('T')[0]; link.download = `study-scheduler-data-${dateStr}.json`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      await saveSetting('lastExportTimestamp', new Date().getTime().toString()); console.log("IndexedDB: Data exported and timestamp saved."); alert("データのエクスポートが完了しました。"); setShowExportReminder(false); return true;
    } catch (error) { console.error("エクスポート処理中にエラー:", error); alert(`データのエクスポート中にエラーが発生しました: ${error.message}`); return false; } finally { setIsLoading(false); }
  }, []);

  // --- CSVフィールドエスケープヘルパー ---
  const escapeCsvField = (field) => {
    if (field === null || typeof field === 'undefined') {
      return '';
    }
    let stringField = String(field);
    // ダブルクオートが含まれていたら、それを2つのダブルクオートに置換
    stringField = stringField.replace(/"/g, '""');
    // カンマ、改行、またはダブルクオートが含まれる可能性のあるフィールド全体をダブルクオートで囲む
    if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('\r') || stringField.includes('"')) {
      // すでにエスケープのための置換でダブルクオートが含まれる場合があるので、囲むのは最初と最後のみ
      if (stringField.startsWith('"') && stringField.endsWith('"') && stringField.match(/"/g).length > 2 && stringField.substring(1, stringField.length -1 ).includes('"') === false ) {
        // no-op: 既に適切にクォートされているケース (例: "field with ""quotes"" inside")
      } else if (stringField.includes('"')) {
         // field が "abc""def" のような既に内部で "" を持つ場合は、そのまま " で囲むと """abc""""def""" になる。
         // 正しくは "abc""def" -> """abc""""def"""ではなく、"abc""def" -> ""abc""""def"" のようにしたい。
         // 現状の stringField.replace(/"/g, '""') で " -> "" になっているので、あとは全体を " で囲むだけで良い。
         stringField = `"${stringField}"`;

      } else {
        stringField = `"${stringField}"`;
      }
    }
    return stringField;
  };


  // --- CSVデータエクスポート ---
  const handleCsvExportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const subjectsToExport = await loadSubjects();
      if (!subjectsToExport || subjectsToExport.length === 0) {
        alert("エクスポートするデータがありません。");
        setIsLoading(false);
        return false;
      }

      const flatQuestions = [];
      subjectsToExport.forEach(subject => {
        const subjectName = subject.subjectName || subject.name || 'Unknown Subject';
        if (subject.chapters && Array.isArray(subject.chapters)) {
          subject.chapters.forEach(chapter => {
            const chapterName = chapter.chapterName || chapter.name || 'Unknown Chapter';
            if (chapter.questions && Array.isArray(chapter.questions)) {
              chapter.questions.forEach(question => {
                flatQuestions.push({
                  // 日本語キーでデータ構造を定義
                  "科目名": subjectName,
                  "章名": chapterName,
                  "問題ID": question.id,
                  "問題番号": question.number,
                  "正解率": question.correctRate,
                  "最終解答日": question.lastAnswered ? new Date(question.lastAnswered).toISOString().split('T')[0] : '',
                  "次回予定日": question.nextDate ? new Date(question.nextDate).toISOString().split('T')[0] : '',
                  "復習間隔": question.interval,
                  "解答回数": question.answerCount,
                  "理解度": question.understanding,
                  "コメント": question.comment || '',
                });
              });
            }
          });
        }
      });

      if (flatQuestions.length === 0) {
        alert("エクスポート対象の問題データがありません。");
        setIsLoading(false);
        return false;
      }
      
      // ヘッダー行も日本語になる (Object.keys が日本語キーを返すため)
      const header = Object.keys(flatQuestions[0]).map(escapeCsvField).join(',');
      const rows = flatQuestions.map(row =>
        Object.values(row).map(val => escapeCsvField(val)).join(',')
      );
      const csvString = `${header}\n${rows.join('\n')}`;
      
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `study-scheduler-questions-${dateStr}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log("CSV Data exported.");
      alert("問題データのCSVエクスポートが完了しました。");
      return true;

    } catch (error) {
      console.error("CSVエクスポート処理中にエラー:", error);
      alert(`CSVデータのエクスポート中にエラーが発生しました: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [escapeCsvField, loadSubjects]); // loadSubjects を依存配列に追加

  // --- 解答履歴CSVデータエクスポート ---
  const handleAnswerHistoryCsvExport = useCallback(async () => {
    setIsLoading(true);
    try {
      const historyToExport = await loadAnswerHistory();
      const subjects = await loadSubjects();

      if (!historyToExport || historyToExport.length === 0) {
        alert("エクスポートする解答履歴がありません。");
        setIsLoading(false);
        return false;
      }

      const questionInfoMap = new Map();
      (subjects || []).forEach(subject => {
        const subjectName = subject.subjectName || subject.name || 'Unknown Subject';
        if (subject.chapters && Array.isArray(subject.chapters)) {
          subject.chapters.forEach(chapter => {
            const chapterName = chapter.chapterName || chapter.name || 'Unknown Chapter';
            if (chapter.questions && Array.isArray(chapter.questions)) {
              chapter.questions.forEach(question => {
                if (question && question.id) {
                  questionInfoMap.set(question.id, { subjectName, chapterName });
                }
              });
            }
          });
        }
      });

      // 日本語ヘッダーの順序を定義
      const headerOrder = ['履歴ID', '問題ID', '科目名', '章名', '正誤', '理解度']; // '解答日時' を削除
      const headerString = headerOrder.map(escapeCsvField).join(',');

      const rows = historyToExport.map(record => {
        const qInfo = questionInfoMap.get(record.questionId) || { subjectName: 'N/A', chapterName: 'N/A' };
        const rowData = {
          '履歴ID': record.id,
          '問題ID': record.questionId,
          '科目名': qInfo.subjectName,
          '章名': qInfo.chapterName,
          // '解答日時': record.timestamp ? new Date(record.timestamp).toISOString() : '', // 削除
          '正誤': typeof record.isCorrect === 'boolean' ? (record.isCorrect ? "正解" : "不正解") : '',
          '理解度': record.understanding,
        };
        return headerOrder.map(fieldKey => escapeCsvField(rowData[fieldKey])).join(',');
      });

      const csvString = `${headerString}\n${rows.join('\n')}`;
      
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `study-scheduler-history-${dateStr}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log("Answer history CSV Data exported.");
      alert("解答履歴データのCSVエクスポートが完了しました。");
      return true;

    } catch (error) {
      console.error("解答履歴CSVエクスポート処理中にエラー:", error);
      alert(`解答履歴データのCSVエクスポート中にエラーが発生しました: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [escapeCsvField, loadAnswerHistory, loadSubjects]);

  // --- 問題IDのみCSVデータエクスポート ---
  const handleQuestionIdOnlyCsvExport = useCallback(async () => {
    setIsLoading(true);
    try {
      const subjectsToExport = await loadSubjects();
      if (!subjectsToExport || subjectsToExport.length === 0) {
        alert("エクスポートする問題がありません。");
        setIsLoading(false);
        return false;
      }

      const questionIds = [];
      subjectsToExport.forEach(subject => {
        if (subject.chapters && Array.isArray(subject.chapters)) {
          subject.chapters.forEach(chapter => {
            if (chapter.questions && Array.isArray(chapter.questions)) {
              chapter.questions.forEach(question => {
                if (question && question.id) {
                  questionIds.push(question.id);
                }
              });
            }
          });
        }
      });

      if (questionIds.length === 0) {
        alert("エクスポート対象の問題IDが見つかりませんでした。");
        setIsLoading(false);
        return false;
      }
      
      const header = "QuestionID";
      const rows = questionIds.map(id => escapeCsvField(id)); // 各IDをエスケープ
      const csvString = `${header}\n${rows.join('\n')}`;
      
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `study-scheduler-question-ids-${dateStr}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log("Question ID list CSV Data exported.");
      alert("問題IDリストのCSVエクスポートが完了しました。");
      return true;

    } catch (error) {
      console.error("問題IDリストCSVエクスポート処理中にエラー:", error);
      alert(`問題IDリストのCSVエクスポート中にエラーが発生しました: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [escapeCsvField, loadSubjects]); // loadSubjectsも依存配列に追加

  // --- 全データCSVエクスポート ---
  const handleFullDataCsvExport = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. 問題データのCSVを生成
      const subjectsToExport = await loadSubjects();
      let questionsCsvString = "### QUESTIONS_DATA_START ###\n";
      if (subjectsToExport && subjectsToExport.length > 0) {
        const flatQuestions = [];
        subjectsToExport.forEach(subject => {
          const subjectName = subject.subjectName || subject.name || 'Unknown Subject';
          if (subject.chapters && Array.isArray(subject.chapters)) {
            subject.chapters.forEach(chapter => {
              const chapterName = chapter.chapterName || chapter.name || 'Unknown Chapter';
              if (chapter.questions && Array.isArray(chapter.questions)) {
                chapter.questions.forEach(question => {
                  flatQuestions.push({
                    // ここを日本語キーにする (データ構造は元の英語キーのまま)
                    "科目名": subjectName,
                    "章名": chapterName,
                    "問題ID": question.id,
                    "問題番号": question.number,
                    "正解率": question.correctRate,
                    "最終解答日": question.lastAnswered ? new Date(question.lastAnswered).toISOString().split('T')[0] : '',
                    "次回予定日": question.nextDate ? new Date(question.nextDate).toISOString().split('T')[0] : '',
                    "復習間隔": question.interval,
                    "解答回数": question.answerCount,
                    "理解度": question.understanding,
                    "コメント": question.comment || '',
                  });
                });
              }
            });
          }
        });
        if (flatQuestions.length > 0) {
          // ヘッダー行も日本語にする
          const questionHeader = Object.keys(flatQuestions[0]).map(escapeCsvField).join(',');
          const questionRows = flatQuestions.map(row =>
            Object.values(row).map(val => escapeCsvField(val)).join(',')
          );
          questionsCsvString += `${questionHeader}\n${questionRows.join('\n')}`;
        } else {
          questionsCsvString += "(問題データがありません)";
        }
      } else {
        questionsCsvString += "(問題データがありません)";
      }
      questionsCsvString += "\n### QUESTIONS_DATA_END ###\n";

      // 2. 解答履歴データのCSVを生成
      const historyToExport = await loadAnswerHistory();
      let historyCsvString = "\n### ANSWER_HISTORY_DATA_START ###\n";
      if (historyToExport && historyToExport.length > 0) {
        const questionInfoMap = new Map();
        (subjectsToExport || []).forEach(subject => { // subjectsToExportがnullの場合も考慮
          const subjectName = subject.subjectName || subject.name || 'Unknown Subject';
          if (subject.chapters && Array.isArray(subject.chapters)) {
            subject.chapters.forEach(chapter => {
              const chapterName = chapter.chapterName || chapter.name || 'Unknown Chapter';
              if (chapter.questions && Array.isArray(chapter.questions)) {
                chapter.questions.forEach(question => {
                  if (question && question.id) {
                    questionInfoMap.set(question.id, { subjectName, chapterName });
                  }
                });
              }
            });
          }
        });

        // 日本語ヘッダーの順序を定義
        const historyHeaderOrder = ['履歴ID', '問題ID', '科目名', '章名', '正誤', '理解度']; // '解答日時' を削除
        const historyHeaderString = historyHeaderOrder.map(escapeCsvField).join(',');
        
        const historyRows = historyToExport.map(record => {
          const qInfo = questionInfoMap.get(record.questionId) || { subjectName: 'N/A', chapterName: 'N/A' };
          const rowData = {
            "履歴ID": record.id,
            "問題ID": record.questionId,
            "科目名": qInfo.subjectName,
            "章名": qInfo.chapterName,
            // "解答日時": record.timestamp ? new Date(record.timestamp).toISOString() : '', // 削除
            "正誤": typeof record.isCorrect === 'boolean' ? (record.isCorrect ? "正解" : "不正解") : '',
            "理解度": record.understanding,
          };
          return historyHeaderOrder.map(field => escapeCsvField(rowData[field])).join(',');
        });
        historyCsvString += `${historyHeaderString}\n${historyRows.join('\n')}`;
      } else {
        historyCsvString += "(解答履歴データがありません)";
      }
      historyCsvString += "\n### ANSWER_HISTORY_DATA_END ###";

      // 3. 結合してダウンロード
      const fullCsvString = questionsCsvString + historyCsvString;
      const blob = new Blob([fullCsvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `full_backup_data-${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log("Full CSV Data exported.");
      alert("全データのCSVエクスポートが完了しました。");
      return true;

    } catch (error) {
      console.error("全データCSVエクスポート処理中にエラー:", error);
      alert(`全データのCSVエクスポート中にエラーが発生しました: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [escapeCsvField, loadSubjects, loadAnswerHistory, setIsLoading]); // 依存配列を修正

  // --- CSVデータインポート ---
  const handleCsvImportData = useCallback(async (csvString) => {
    if (!window.confirm("CSVから問題データをインポートすると、既存のデータが変更される可能性があります。続行しますか？\n(同じ科目名・章名・問題IDのデータは上書きされ、新しいデータは追加されます)")) {
      console.log("CSVインポートがキャンセルされました");
      return false;
    }
    setIsLoading(true);

    // ヘッダー名定義 (英語をキーとし、日本語エイリアスを配列で持つ)
    // これは全データインポートで定義したものと同様の構造
    const questionHeaderAliases = {
      SubjectName: ["科目名"],
      ChapterName: ["章名"],
      QuestionID: ["問題ID"],
      QuestionNumber: ["問題番号"],
      CorrectRate: ["正解率"],
      LastAnsweredDate: ["最終解答日"],
      NextScheduledDate: ["次回予定日"],
      Interval: ["復習間隔"],
      AnswerCount: ["解答回数"],
      Understanding: ["理解度"],
      Comment: ["コメント"],
    };

    // CSVヘッダーを解析し、標準名(英語)へのマッピングを作成
    const getQuestionHeaderMapping = (csvHeaderRow) => {
      const parsedCsvHeader = parseCsvLineToArray(csvHeaderRow);
      const mapping = {};
      parsedCsvHeader.forEach((csvColName, index) => {
        let normalizedName = csvColName; // デフォルトはCSVの列名そのまま
        for (const [stdName, aliases] of Object.entries(questionHeaderAliases)) {
          if (csvColName === stdName || aliases.includes(csvColName)) {
            normalizedName = stdName; // 標準名に変換
            break;
          }
        }
        mapping[index] = normalizedName; // マッピングは {columnIndex: normalizedName}
      });
      return mapping; // 例: {0: 'SubjectName', 1: 'ChapterName', ...}
    };

    try {
      const lines = csvString.split(/\r\n|\n/);
      if (lines.length < 2) {
        alert("CSVファイルが空か、ヘッダー行がありません。");
        setIsLoading(false);
        return false;
      }

      const headerMapping = getQuestionHeaderMapping(lines[0]);
      const mappedHeaderValues = Object.values(headerMapping);

      // 期待される標準英語ヘッダー (インポートロジックのキーとして使用)
      const expectedStdHeader = ['SubjectName', 'ChapterName', 'QuestionID', 'QuestionNumber', 'CorrectRate', 'LastAnsweredDate', 'NextScheduledDate', 'Interval', 'AnswerCount', 'Understanding', 'Comment'];
      
      // 必須ヘッダーがマッピングによって全て見つかるか検証
      const requiredStdHeaders = ['SubjectName', 'ChapterName', 'QuestionID'];
      if (!requiredStdHeaders.every(reqHdr => mappedHeaderValues.includes(reqHdr))){
        alert(`CSVのヘッダーに必要な項目（科目名, 章名, 問題IDのいずれか）が見つかりません。現在のヘッダーから認識できた項目: ${mappedHeaderValues.join(', ')}`);
        setIsLoading(false);
        return false;
      }

      const importedQuestionsData = [];
      const chapterQuestionCounters = new Map();

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = parseCsvLineToArray(lines[i]); // parseCsvLineToArray を使う
        const rawQuestionData = {};
        // headerMapping を使って、CSVの列indexから標準名にデータを割り当てる
        Object.entries(headerMapping).forEach(([colIndex, normalizedName]) => {
          if (values[colIndex] !== undefined) {
            rawQuestionData[normalizedName] = values[colIndex];
          }
        });

        if (!rawQuestionData.SubjectName || !rawQuestionData.ChapterName || !rawQuestionData.QuestionID) {
           console.warn(`Skipping line ${i + 1}: SubjectName, ChapterName, or QuestionID is missing.`);
           continue;
        }
        
        let questionNumber = parseInt(rawQuestionData.QuestionNumber, 10);
        if (isNaN(questionNumber) || questionNumber <= 0) {
          const chapterKey = `${rawQuestionData.SubjectName}___${rawQuestionData.ChapterName}`;
          const currentCounter = chapterQuestionCounters.get(chapterKey) || 0;
          questionNumber = currentCounter + 1;
          chapterQuestionCounters.set(chapterKey, questionNumber);
        }
        rawQuestionData.ProcessedQuestionNumber = questionNumber;

        importedQuestionsData.push(rawQuestionData);
      }

      if (importedQuestionsData.length === 0) {
        alert("CSVからインポートできる有効な問題データが見つかりませんでした。");
        setIsLoading(false);
        return false;
      }

      let currentSubjects = await loadSubjects();
      const subjectMap = new Map(currentSubjects.map(s => [s.subjectName || s.name, s]));

      importedQuestionsData.forEach(iq => {
        const subjectName = iq.SubjectName;
        const chapterName = iq.ChapterName;
        const questionId = iq.QuestionID;

        let subject = subjectMap.get(subjectName);
        if (!subject) {
          const newSubId = Date.now().toString(36) + Math.random().toString(36).substring(2);
          subject = {
            id: newSubId, subjectId: newSubId, name: subjectName, subjectName: subjectName, chapters: []
          };
          currentSubjects.push(subject);
          subjectMap.set(subjectName, subject);
        }
        if (!subject.chapters) subject.chapters = [];

        let chapter = subject.chapters.find(c => (c.chapterName || c.name) === chapterName);
        if (!chapter) {
          const newChapId = Date.now().toString(36) + Math.random().toString(36).substring(2);
          chapter = {
            id: newChapId, chapterId: newChapId, name: chapterName, chapterName: chapterName, questions: []
          };
          subject.chapters.push(chapter);
        }
        if (!chapter.questions) chapter.questions = [];

        let question = chapter.questions.find(q => q.id === questionId);
        const newQuestionData = {
          id: questionId,
          number: iq.ProcessedQuestionNumber,
          correctRate: parseInt(iq.CorrectRate, 10) || 0,
          lastAnswered: iq.LastAnsweredDate ? new Date(iq.LastAnsweredDate) : null,
          nextDate: iq.NextScheduledDate ? new Date(iq.NextScheduledDate).toISOString() : null,
          interval: iq.Interval || '1日',
          answerCount: parseInt(iq.AnswerCount, 10) || 0,
          understanding: iq.Understanding || '理解○', // 日本語もそのまま受け入れる
          comment: iq.Comment || '',
        };

        if (question) {
          Object.assign(question, newQuestionData);
        } else {
          chapter.questions.push(newQuestionData);
        }
      });

      await saveSubjects(currentSubjects);
      setSubjects(currentSubjects);
      
      console.log(`CSV Data imported: ${importedQuestionsData.length} questions processed.`);
      alert(`CSVから ${importedQuestionsData.length} 件の問題データを処理しました。`);
      return true;

    } catch (error) {
      console.error("CSVインポート処理中にエラー:", error);
      alert(`CSVデータのインポート中にエラーが発生しました: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadSubjects, saveSubjects, setSubjects, parseCsvLineToArray]); // 依存関係を修正

  // --- 解答履歴CSVデータインポート ---
  const handleAnswerHistoryCsvImport = useCallback(async (csvString) => {
    if (!window.confirm("解答履歴CSVをインポートすると、現在の解答履歴はファイルの内容で【完全に上書き】されます。問題リストは変更されません。この操作は元に戻せません。続行しますか？")) {
      return { success: false, message: "インポートがキャンセルされました。" };
    }
    setIsLoading(true);
    try {
      const lines = csvString.split(/\r\n|\n|\r/);
      if (lines.length < 2) throw new Error("CSVファイルにヘッダー行またはデータ行がありません。");

      const headerLine = lines[0];
      const dataLines = lines.slice(1).filter(line => line.trim() !== '');
      if (dataLines.length === 0) throw new Error("CSVファイルにデータがありません。");

      const parsedHeader = parseCsvLineToArray(headerLine, "解答履歴CSV");
      console.log("Parsed Answer History CSV Header:", parsedHeader);

      const historyHeaderAliases = {
        "履歴ID": "id",
        "問題ID": "questionId",
        // "解答日時": "timestamp", // 削除済み
        "正誤": "isCorrect",
        "理解度": "understanding",
        "科目名": "subjectName", 
        "章名": "chapterName",   
        "HistoryID": "id",
        "QuestionID": "questionId",
        // "Timestamp": "timestamp", // 削除済み
        "IsCorrect": "isCorrect",
        "Understanding": "understanding",
        "SubjectName": "subjectName",
        "ChapterName": "chapterName",
      };
      
      // timestamp を必須から削除
      const requiredStdHeaders = ["id", "questionId", "isCorrect", "understanding"]; 
      const headerMap = {};
      let missingHeaders = [...requiredStdHeaders];

      parsedHeader.forEach((rawHeader, index) => {
        const header = rawHeader.trim();
        const stdHeader = historyHeaderAliases[header];
        if (stdHeader) {
          headerMap[stdHeader] = index;
          // 必須ヘッダーから見つかったものを除く
          if (requiredStdHeaders.includes(stdHeader)) {
            missingHeaders = missingHeaders.filter(h => h !== stdHeader);
          }
        }
      });

      if (missingHeaders.length > 0) {
        throw new Error(`解答履歴CSVの必須ヘッダーが不足しています: ${missingHeaders.join(', ')}。最低限、履歴ID, 問題ID, 正誤, 理解度が必要です。`);
      }
      
      const newAnswerHistory = [];
      for (const [i, line] of dataLines.entries()) {
        if (!line.trim()) continue;
        const values = parseCsvLineToArray(line, "解答履歴CSV", parsedHeader.length);
        
        let isCorrectValue;
        const isCorrectStr = values[headerMap.isCorrect]?.trim();
        if (isCorrectStr === "正解" || isCorrectStr?.toLowerCase() === "true" || isCorrectStr === "1") {
          isCorrectValue = true;
        } else if (isCorrectStr === "不正解" || isCorrectStr?.toLowerCase() === "false" || isCorrectStr === "0") {
          isCorrectValue = false;
        } else if (isCorrectStr === "" || isCorrectStr === undefined) {
          isCorrectValue = null; 
        } else {
          throw new Error(`解答履歴CSVの${i+1}行目(${i+2}行目)、「正誤」列の値が無効です: 「${isCorrectStr}」。正解、不正解、true、false、1、0、または空欄である必要があります。`);
        }

        const understandingStr = values[headerMap.understanding]?.trim();
        let understandingValue;
        if (understandingStr === "理解した" || understandingStr?.toLowerCase() === "understood") understandingValue = "understood";
        else if (understandingStr === "まあまあ" || understandingStr?.toLowerCase() === "somewhat") understandingValue = "somewhat";
        else if (understandingStr === "要復習" || understandingStr?.toLowerCase() === "needs review") understandingValue = "needs review";
        else if (understandingStr === "" || understandingStr === undefined) understandingValue = ""; 
        else {
          throw new Error(`解答履歴CSVの${i+1}行目(${i+2}行目)、「理解度」列の値が無効です: 「${understandingStr}」。理解した、まあまあ、要復習、understood、somewhat、needs review、または空欄である必要があります。`);
        }

        // timestamp のパースと設定処理は削除 (またはオプションにする)
        // CSVからはtimestampを読み込まない方針

        const historyEntry = {
          id: values[headerMap.id]?.trim() || uuidv4(),
          questionId: values[headerMap.questionId]?.trim(),
          // timestamp: undefined, // CSVからは設定しない
          isCorrect: isCorrectValue,
          understanding: understandingValue,
        };

        if (!historyEntry.questionId) {
          throw new Error(`解答履歴CSVの${i+1}行目(${i+2}行目)、「問題ID」が空です。`);
        }
        if (!historyEntry.id) { // IDも必須とする
          throw new Error(`解答履歴CSVの${i+1}行目(${i+2}行目)、「履歴ID」が空です。`);
        }

        newAnswerHistory.push(historyEntry);
      }

      // timestamp がないので、ソートは行わない（またはID順など別の基準）
      await saveAnswerHistory(newAnswerHistory);
      setAnswerHistory(newAnswerHistory); 

      console.log("Answer history CSV data imported and overwritten.");
      return { success: true, message: "解答履歴データのインポートと上書きが完了しました。" };

    } catch (error) {
      console.error("解答履歴CSVインポート処理中にエラー:", error);
      return { success: false, message: `解答履歴CSVのインポート中にエラーが発生しました: ${error.message}` };
    } finally {
      setIsLoading(false);
    }
  }, [parseCsvLineToArray, saveAnswerHistory, uuidv4, setIsLoading, setAnswerHistory]); // 依存関係を更新

  // --- リマインダー関連のハンドラ関数 ---
  const handleReminderDismiss = useCallback(() => {
    setShowExportReminder(false);
    setDaysSinceLastExport(null);
    saveSetting('reminderDismissedTimestamp', new Date().getTime().toString());
  }, [saveSetting]);

  const handleReminderCheck = useCallback(async () => {
    if (isLoading) return;
    try {
      const lastExportTimestamp = await loadSetting('lastExportTimestamp');
      const reminderDismissedTimestamp = await loadSetting('reminderDismissedTimestamp');
      const now = new Date().getTime();
      if (!reminderDismissedTimestamp) {
        setShowExportReminder(true);
        setDaysSinceLastExport(null);
        saveSetting('reminderDismissedTimestamp', now.toString());
      } else if (now - parseInt(reminderDismissedTimestamp, 10) >= 1000 * 60 * 60 * 24 * 3) {
        setShowExportReminder(true);
        setDaysSinceLastExport(Math.floor((now - parseInt(reminderDismissedTimestamp, 10)) / (1000 * 60 * 60 * 24)));
        saveSetting('reminderDismissedTimestamp', now.toString());
      } else {
        setShowExportReminder(false);
        setDaysSinceLastExport(null);
      }
    } catch (error) {
      console.error("Error checking reminder:", error);
      setShowExportReminder(true);
      setDaysSinceLastExport(null);
    }
  }, [isLoading, loadSetting, saveSetting]);

  useEffect(() => {
    handleReminderCheck();
  }, [handleReminderCheck]);

  // --- ダッシュボードレイアウトの変更 ---
  const handleDashboardLayoutChange = useCallback((newLayout) => {
    setDashboardLayouts(newLayout);
    saveSetting('dashboardLayouts', newLayout);
  }, [saveSetting]);

  // --- ウィジェットの変更 ---
  const handleWidgetChange = useCallback((newWidgets) => {
    setActiveWidgets(newWidgets);
    saveSetting('activeWidgets', newWidgets);
  }, [saveSetting]);

  // --- ダッシュボードレイアウトの表示 ---
  const renderDashboardLayout = useMemo(() => {
    if (!dashboardLayouts) return null;
    return (
      <Dashboard
        subjects={subjects}
        answerHistory={answerHistory}
        activeWidgets={activeWidgets}
        onLayoutChange={handleDashboardLayoutChange}
        onWidgetChange={handleWidgetChange}
      />
    );
  }, [dashboardLayouts, subjects, answerHistory, activeWidgets, handleDashboardLayoutChange, handleWidgetChange]);

  // --- 全データCSVインポート ---
  const handleFullDataCsvImport = useCallback(async (csvString) => {
    if (!window.confirm("全データCSVをインポートすると、現在のすべての問題データと解答履歴がCSVファイルの内容で【完全に上書き】されます。この操作は元に戻せません。続行しますか？")) {
      return { success: false, message: "インポートがキャンセルされました。" };
    }
    setIsLoading(true);

    // 共通ヘッダーエイリアス (問題データと解答履歴データで共用)
    const commonHeaderAliases = {
      SubjectName: ["科目名"],
      ChapterName: ["章名"],
      QuestionID: ["問題ID"],
      QuestionNumber: ["問題番号"],
      CorrectRate: ["正解率"],
      LastAnsweredDate: ["最終解答日"],
      NextScheduledDate: ["次回予定日"],
      Interval: ["復習間隔"],
      AnswerCount: ["解答回数"],
      Understanding: ["理解度"],
      Comment: ["コメント"],
      id: ["履歴ID"], // 解答履歴用
      isCorrect: ["正誤"], // 解答履歴用
    };

    const getHeaderMapping = (csvHeaderRow, context) => {
      const parsedCsvHeader = parseCsvLineToArray(csvHeaderRow);
      const mapping = {};
      const foundNormalizedHeaders = new Set();
      parsedCsvHeader.forEach((csvColName, index) => {
        let normalizedName = null;
        for (const [stdName, aliases] of Object.entries(commonHeaderAliases)) {
          if (csvColName === stdName || aliases.includes(csvColName)) {
            normalizedName = stdName;
            break;
          }
        }
        if (normalizedName) {
          if (foundNormalizedHeaders.has(normalizedName) && 
              !['QuestionID', 'Understanding', 'SubjectName', 'ChapterName'].includes(normalizedName)
          ) {
             console.warn(`ヘッダーに重複の可能性がある列名 (${context}): '${csvColName}' は既に '${normalizedName}' にマッピング済みです。`);
          }
          mapping[index] = normalizedName;
          foundNormalizedHeaders.add(normalizedName);
        } else {
          console.warn(`不明なヘッダー列 (${context}) '${csvColName}' は無視されます。`);
        }
      });
      return mapping;
    };

    const parseIsCorrectValue = (value, rowIndex, context) => {
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase().trim();
        if (lowerValue === "true" || lowerValue === "正解" || lowerValue === "はい" || lowerValue === "1") return true;
        if (lowerValue === "false" || lowerValue === "不正解" || lowerValue === "いいえ" || lowerValue === "0") return false;
        if (lowerValue === "") return null;
        throw new Error(`全データCSV(${context})の${rowIndex}行目、「正誤」列の値が無効です: 「${value}」。正解/不正解、true/false、1/0、または空欄である必要があります。`);
      }
      if (value === null || value === undefined) return null;
      throw new Error(`全データCSV(${context})の${rowIndex}行目、「正誤」列の型が無効です。文字列である必要があります。`);
    };

    const parseUnderstandingValue = (value, rowIndex, context) => {
        if (typeof value === 'string') {
            const trimmedValue = value.trim();
            if (trimmedValue === "理解した" || trimmedValue.toLowerCase() === "understood") return "understood";
            if (trimmedValue === "まあまあ" || trimmedValue.toLowerCase() === "somewhat") return "somewhat";
            if (trimmedValue === "要復習" || trimmedValue.toLowerCase() === "needs review") return "needs review";
            if (trimmedValue === "") return "";
            throw new Error(`全データCSV(${context})の${rowIndex}行目、「理解度」列の値が無効です: 「${value}」。理解した/まあまあ/要復習、understood/somewhat/needs review、または空欄である必要があります。`);
        }
        if (value === null || value === undefined) return "";
        throw new Error(`全データCSV(${context})の${rowIndex}行目、「理解度」列の型が無効です。文字列である必要があります。`);
    };

    try {
      const questionDataSectionMatch = csvString.match(/### QUESTIONS_DATA_START ###([\s\S]*?)### QUESTIONS_DATA_END ###/);
      const historyDataSectionMatch = csvString.match(/### ANSWER_HISTORY_DATA_START ###([\s\S]*?)### ANSWER_HISTORY_DATA_END ###/);

      if (!questionDataSectionMatch || !historyDataSectionMatch) {
        throw new Error("CSVファイルの形式が無効です。必要なデータセクションの区切り (### QUESTIONS_DATA_START ### など) が見つかりません。");
      }

      const questionCsvContent = questionDataSectionMatch[1].trim();
      const historyCsvContent = historyDataSectionMatch[1].trim();

      const newSubjects = [];
      const chapterQuestionCounters = new Map(); 

      if (questionCsvContent && questionCsvContent !== "(問題データがありません)") {
        const qLines = questionCsvContent.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
        if (qLines.length >= 1) { 
          const qHeaderMapping = getHeaderMapping(qLines[0], "問題データ");
          const requiredQHeaders = ['SubjectName', 'ChapterName', 'QuestionID']; 
          if (!requiredQHeaders.every(rh => Object.values(qHeaderMapping).includes(rh))) {
            throw new Error(`問題データに必要なヘッダー (${requiredQHeaders.join(', ')}) の一部が見つかりません。認識されたヘッダー: ${Object.values(qHeaderMapping).join(', ')}`);
          }

          const subjectMap = new Map();
          for (let i = 1; i < qLines.length; i++) {
            const values = parseCsvLineToArray(qLines[i]);
            const rawQData = {};
            Object.entries(qHeaderMapping).forEach(([colIndex, normalizedName]) => {
              if (values[colIndex] !== undefined) {
                rawQData[normalizedName] = values[colIndex];
              }
            });

            if (!rawQData.SubjectName || !rawQData.ChapterName || !rawQData.QuestionID) {
              console.warn(`問題データの行 ${i + 1}: 必須項目 (科目名, 章名, 問題ID) が不足しているためスキップします。`);
              continue;
            }

            let questionNumber = parseInt(rawQData.QuestionNumber, 10);
            const chapterKey = `${rawQData.SubjectName}___${rawQData.ChapterName}`;
            if (isNaN(questionNumber) || questionNumber <= 0) {
              const currentCounter = chapterQuestionCounters.get(chapterKey) || 0;
              questionNumber = currentCounter + 1;
              chapterQuestionCounters.set(chapterKey, questionNumber);
            }

            let subject = subjectMap.get(rawQData.SubjectName);
            if (!subject) {
              const newSubId = Date.now().toString(36) + Math.random().toString(36).substring(2);
              subject = { id: newSubId, subjectId: newSubId, name: rawQData.SubjectName, subjectName: rawQData.SubjectName, chapters: [] };
              newSubjects.push(subject);
              subjectMap.set(rawQData.SubjectName, subject);
            }
            if (!subject.chapters) subject.chapters = [];

            let chapter = subject.chapters.find(c => (c.chapterName || c.name) === rawQData.ChapterName);
            if (!chapter) {
              const newChapId = Date.now().toString(36) + Math.random().toString(36).substring(2);
              chapter = { id: newChapId, chapterId: newChapId, name: rawQData.ChapterName, chapterName: rawQData.ChapterName, questions: [] };
              subject.chapters.push(chapter);
            }
            if (!chapter.questions) chapter.questions = [];

            const questionData = {
              id: rawQData.QuestionID,
              number: questionNumber,
              correctRate: parseInt(rawQData.CorrectRate, 10) || 0,
              lastAnswered: rawQData.LastAnsweredDate ? new Date(rawQData.LastAnsweredDate) : null,
              nextDate: rawQData.NextScheduledDate ? new Date(rawQData.NextScheduledDate).toISOString() : null,
              interval: rawQData.Interval || '1日',
              answerCount: parseInt(rawQData.AnswerCount, 10) || 0,
              understanding: parseUnderstandingValue(rawQData.Understanding, i + 1, "問題データ"),
              comment: rawQData.Comment || '',
            };
            const existingQIndex = chapter.questions.findIndex(q => q.id === questionData.id);
            if (existingQIndex > -1) {
              chapter.questions[existingQIndex] = questionData;
            } else {
              chapter.questions.push(questionData);
            }
          }
        }
      }

      const newAnswerHistory = [];
      if (historyCsvContent && historyCsvContent !== "(解答履歴データがありません)") {
        const hLines = historyCsvContent.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
        if (hLines.length >= 1) { 
          const hHeaderMapping = getHeaderMapping(hLines[0], "解答履歴データ");
          const requiredHHeaders = ['id', 'QuestionID', 'isCorrect', 'Understanding']; 
          if (!requiredHHeaders.every(rh => Object.values(hHeaderMapping).includes(rh))) {
             throw new Error(`解答履歴に必要なヘッダー (${requiredHHeaders.join(', ')}) の一部が見つかりません。認識されたヘッダー: ${Object.values(hHeaderMapping).join(', ')}`);
          }

          for (let i = 1; i < hLines.length; i++) {
            const values = parseCsvLineToArray(hLines[i]);
            const entry = {};
            Object.entries(hHeaderMapping).forEach(([colIndex, normalizedName]) => {
              if (values[colIndex] !== undefined) {
                entry[normalizedName] = values[colIndex];
              }
            });

            if (!entry.id || !entry.QuestionID || typeof entry.isCorrect === 'undefined') { 
              console.warn(`行 ${i + 1} (解答履歴): 必須フィールド (履歴ID, 問題ID, 正誤) が不足、または正誤の値が無効なためスキップします。`); continue;
            }
            
            const isCorrectValue = parseIsCorrectValue(entry.isCorrect, i + 1, "解答履歴データ");
            const understandingValue = parseUnderstandingValue(entry.Understanding, i + 1, "解答履歴データ");

            newAnswerHistory.push({
              id: entry.id,
              questionId: entry.QuestionID,
              isCorrect: isCorrectValue,
              understanding: understandingValue,
            });
          }
        }
      }

      const db = await openDB();
      // 単一トランザクションでクリアと書き込みを行う
      const tx = db.transaction([STORE_SUBJECTS, STORE_HISTORY], 'readwrite');
      const subjectsStore = tx.objectStore(STORE_SUBJECTS);
      const historyStore = tx.objectStore(STORE_HISTORY);

      await new Promise((resolve, reject) => { // subjectsストアのクリア
        const req = subjectsStore.clear();
        req.onsuccess = resolve;
        req.onerror = (e) => reject(new Error(`Failed to clear subjects store: ${e.target.error?.message || e.target.error}`));
      });
      await new Promise((resolve, reject) => { // historyストアのクリア
        const req = historyStore.clear();
        req.onsuccess = resolve;
        req.onerror = (e) => reject(new Error(`Failed to clear history store: ${e.target.error?.message || e.target.error}`));
      });
      
      // newSubjectsの書き込み
      for (const subject of newSubjects) {
        await new Promise((resolve, reject) => {
          const req = subjectsStore.put(subject);
          req.onsuccess = resolve;
          req.onerror = (e) => reject(new Error(`Failed to put subject ${subject.id}: ${e.target.error?.message || e.target.error}`));
        });
      }
      // newAnswerHistoryの書き込み
      for (const record of newAnswerHistory) {
        await new Promise((resolve, reject) => {
          const req = historyStore.put(record);
          req.onsuccess = resolve;
          req.onerror = (e) => reject(new Error(`Failed to put history record ${record.id}: ${e.target.error?.message || e.target.error}`));
        });
      }
      
      await tx.done; // トランザクションをコミット
      
      setSubjects(newSubjects);
      setAnswerHistory(newAnswerHistory); 

      console.log("全データCSVインポート完了");
      return { success: true, message: "全データのインポートに成功しました。" };

    } catch (error) {
      console.error("全データCSVインポート処理中にエラー:", error);
      // エラー発生時は状態をロールバックしない（IndexedDBトランザクションが失敗すれば自動的にロールバックされる）
      return { success: false, message: `インポートエラー: ${error.message}` };
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setSubjects, setAnswerHistory, openDB, parseCsvLineToArray, STORE_SUBJECTS, STORE_HISTORY]); // 依存配列にSTORE_SUBJECTS, STORE_HISTORY追加

  // --- 解答履歴JSONエクスポート ---
  const handleAnswerHistoryJsonExport = useCallback(async () => {
    setIsLoading(true);
    try {
      const historyToExport = await loadAnswerHistory();
      if (!historyToExport || historyToExport.length === 0) {
        alert("エクスポートする解答履歴がありません。");
        setIsLoading(false);
        return false;
      }
      const exportData = {
        exportDate: new Date().toISOString(),
        dataType: "answerHistoryOnly",
        appVersion: "1.2.0-custom",
        answerHistory: historyToExport
      };
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `answer_history_export-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert("解答履歴のJSONエクスポートが完了しました。");
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("解答履歴JSONエクスポートエラー:", error);
      alert(`解答履歴のJSONエクスポート中にエラーが発生しました: ${error.message}`);
      setIsLoading(false);
      return false;
    } 
  }, [setIsLoading, loadAnswerHistory]);

  // --- 解答履歴JSONインポート ---
  const handleAnswerHistoryJsonImport = useCallback(async (jsonString) => {
    if (!window.confirm("解答履歴JSONをインポートすると、現在の解答履歴はファイルの内容で【完全に上書き】されます。この操作は元に戻せません。続行しますか？")) {
      return { success: false, message: "インポートがキャンセルされました。" };
    }
    setIsLoading(true);
    try {
      const importedObject = JSON.parse(jsonString);
      if (!importedObject || importedObject.dataType !== "answerHistoryOnly" || !Array.isArray(importedObject.answerHistory)) {
        throw new Error("無効な解答履歴JSONファイル形式です。ファイルが破損しているか、形式が異なります。 (dataType: answerHistoryOnly が必要)");
      }
      const newAnswerHistory = importedObject.answerHistory;

      for (const record of newAnswerHistory) {
        // timestamp は必須ではなくなった
        if (!record.id || !record.questionId) { 
          throw new Error("解答履歴データ内に必須フィールド (id, questionId) が不足しているレコードがあります。");
        }
        // timestamp が存在する場合、有効な日付か確認 (任意)
        if (record.timestamp && isNaN(new Date(record.timestamp).getTime())) {
          console.warn(`解答履歴レコード (ID: ${record.id}) の timestamp 「${record.timestamp}」は無効な日付形式です。timestampなしとして扱われます。`);
          record.timestamp = undefined; // 無効な場合はundefinedに
        }
      }

      const db = await openDB();
      const tx = db.transaction(STORE_HISTORY, 'readwrite');
      await tx.objectStore(STORE_HISTORY).clear();
      for (const record of newAnswerHistory) {
        // 確実に id があるようにする (もしJSONになくてもここで生成)
        const historyId = record.id || (crypto.randomUUID ? crypto.randomUUID() : `history-${Date.now()}-${Math.random()}`);
        await tx.objectStore(STORE_HISTORY).put({ ...record, id: historyId });
      }
      await tx.done;

      // timestamp が存在する場合のみソートキーとして意味がある
      // timestamp がないものは最後尾、またはID順など別のルールも検討可能
      const sortedHistory = newAnswerHistory.sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : Infinity; // timestampなしは最後に
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : Infinity;
        if (aTime !== bTime) {
          return aTime - bTime;
        }
        // timestampが同じか、両方ない場合はIDでソート (安定ソートのため)
        if (a.id && b.id) return String(a.id).localeCompare(String(b.id));
        return 0;
      });

      setAnswerHistory(sortedHistory);
      setIsLoading(false);
      return { success: true, message: `解答履歴 ${newAnswerHistory.length} 件のJSONインポートに成功しました。` };

    } catch (error) {
      console.error("解答履歴JSONインポートエラー:", error);
      setIsLoading(false);
      return { success: false, message: `インポートエラー: ${error.message}` };
    }
  }, [setIsLoading, setAnswerHistory, openDB]);

  // --- 問題IDリストJSONエクスポート ---
  const handleQuestionIdOnlyJsonExport = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentSubjects = await loadSubjects();
      if (!currentSubjects || currentSubjects.length === 0) {
        alert("エクスポートする問題データがありません。");
        setIsLoading(false);
        return false;
      }
      const questionIds = [];
      currentSubjects.forEach(subject => {
        if (subject && Array.isArray(subject.chapters)) {
          subject.chapters.forEach(chapter => {
            if (chapter && Array.isArray(chapter.questions)) {
              chapter.questions.forEach(question => {
                if (question && question.id) {
                  questionIds.push(question.id);
                }
              });
            }
          });
        }
      });

      if (questionIds.length === 0) {
        alert("エクスポート対象の問題IDが見つかりませんでした。");
        setIsLoading(false);
        return false;
      }

      const exportData = {
        exportDate: new Date().toISOString(),
        dataType: "questionIdListOnly",
        appVersion: "1.2.0-custom",
        questionIds: questionIds
      };
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `question_id_list_export-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert("問題IDリストのJSONエクスポートが完了しました。");
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("問題IDリストJSONエクスポートエラー:", error);
      alert(`問題IDリストのJSONエクスポート中にエラーが発生しました: ${error.message}`);
      setIsLoading(false);
      return false;
    }
  }, [setIsLoading, loadSubjects]);

  // --- 問題リストJSONエクスポート ---
  const handleQuestionListJsonExport = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentSubjects = await loadSubjects();
      if (!currentSubjects || currentSubjects.length === 0) {
        alert("エクスポートする問題データがありません。");
        setIsLoading(false);
        return false;
      }
      const exportData = {
        exportDate: new Date().toISOString(),
        dataType: "questionListOnly",
        appVersion: "1.2.0-custom", 
        subjects: currentSubjects
      };
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `question_list_export-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert("問題リストのJSONエクスポートが完了しました。");
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("問題リストJSONエクスポートエラー:", error);
      alert(`問題リストのJSONエクスポート中にエラーが発生しました: ${error.message}`);
      setIsLoading(false);
      return false;
    }
  }, [setIsLoading, loadSubjects]);

  // --- 問題リストJSONインポート ---
  const handleQuestionListJsonImport = useCallback(async (jsonString) => {
    if (!window.confirm("問題リストJSONをインポートすると、現在の問題リストはファイルの内容で【完全に上書き】されます。解答履歴は変更されません。この操作は元に戻せません。続行しますか？")) {
      return { success: false, message: "インポートがキャンセルされました。" };
    }
    setIsLoading(true);
    try {
      const importedObject = JSON.parse(jsonString);
      if (!importedObject || importedObject.dataType !== "questionListOnly" || !Array.isArray(importedObject.subjects)) {
        throw new Error("無効な問題リストJSONファイル形式です。ファイルが破損しているか、形式が異なります。(dataType: questionListOnly が必要)");
      }
      const newSubjects = importedObject.subjects;

      await saveSubjects(newSubjects);
      setSubjects(newSubjects);
      
      const initialExpandedSubjectsState = {};
      newSubjects.forEach(subject => { if (subject?.id) { initialExpandedSubjectsState[subject.id] = false; } });
      if (newSubjects.length > 0 && newSubjects[0]?.id) { initialExpandedSubjectsState[newSubjects[0].id] = true; }
      setExpandedSubjects(initialExpandedSubjectsState);
      setExpandedChapters({}); 

      setIsLoading(false);
      return { success: true, message: `問題リスト ${newSubjects.length} 件のJSONインポートに成功しました。` };

    } catch (error) {
      console.error("問題リストJSONインポートエラー:", error);
      setIsLoading(false);
      return { success: false, message: `インポートエラー: ${error.message}` };
    }
  }, [setIsLoading, setSubjects, saveSubjects, setExpandedSubjects, setExpandedChapters]);

  // --- メインビュー切り替え ---
  const MainView = () => {
    if (isLoading || activeWidgets === null) {
      return <div className="p-8 text-center text-gray-500">データを読み込んでいます...</div>;
    }
    switch (activeTab) {
      case 'today': return <TodayView todayQuestions={todayQuestionsList} recordAnswer={recordAnswer} formatDate={formatDate} />;
      case 'schedule': return <ScheduleView subjects={subjects} getQuestionsForDate={getQuestionsForDate} handleQuestionDateChange={handleQuestionDateChange} formatDate={formatDate} />;
      case 'all': return <RedesignedAllQuestionsView subjects={subjects} expandedSubjects={expandedSubjects} expandedChapters={expandedChapters} toggleSubject={toggleSubject} toggleChapter={toggleChapter} setEditingQuestion={setEditingQuestion} setBulkEditMode={setBulkEditMode} bulkEditMode={bulkEditMode} selectedQuestions={selectedQuestions} setSelectedQuestions={setSelectedQuestions} selectedDate={selectedDate} setSelectedDate={setSelectedDate} saveBulkEdit={saveBulkEdit} formatDate={formatDate} toggleQuestionSelection={toggleQuestionSelection} />;
      case 'dashboard':
        return <Dashboard
                 subjects={subjects}
                 answerHistory={answerHistory}
                 formatDate={formatDate} // Dashboard にも formatDate を渡す
                 layouts={dashboardLayouts}
                 onLayoutChange={handleDashboardLayoutChange} // 名前変更: handleLayoutChange -> handleDashboardLayoutChange
                 activeWidgets={activeWidgets}
                 availableWidgets={availableWidgets} // availableWidgets を渡す
                 onActiveWidgetsChange={handleWidgetChange} // 名前変更: updateActiveWidgets -> handleWidgetChange
               />;
      case 'trends': return <AmbiguousTrendsPage subjects={subjects} formatDate={formatDate} answerHistory={answerHistory} saveComment={saveComment} />;
      case 'stats': return <EnhancedStatsPage subjects={subjects} answerHistory={answerHistory} formatDate={formatDate} />;
      case 'settings': return <SettingsPage 
                                onResetData={resetAllData} 
                                onResetAnswerStatusOnly={resetAnswerStatusOnly} 
                                onDataImport={handleDataImport} 
                                onDataExport={handleDataExport} 
                                onCsvDataExport={handleCsvExportData}
                                onCsvDataImport={handleCsvImportData}
                                onAnswerHistoryCsvExport={handleAnswerHistoryCsvExport}
                                onQuestionIdOnlyCsvExport={handleQuestionIdOnlyCsvExport}
                                onAnswerHistoryCsvImport={handleAnswerHistoryCsvImport}
                                onFullDataCsvExport={handleFullDataCsvExport} // 全データCSVエクスポート
                                onFullDataCsvImport={handleFullDataCsvImport} // 全データCSVインポート
                                onAnswerHistoryJsonExport={handleAnswerHistoryJsonExport} 
                                onAnswerHistoryJsonImport={handleAnswerHistoryJsonImport} 
                                onQuestionIdOnlyJsonExport={handleQuestionIdOnlyJsonExport}
                                onQuestionListJsonExport={handleQuestionListJsonExport}
                                onQuestionListJsonImport={handleQuestionListJsonImport}
                             />;
      default: return <TodayView todayQuestions={todayQuestionsList} recordAnswer={recordAnswer} formatDate={formatDate} />;
    }
  };

  // --- アプリ全体のレンダリング ---
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      {showExportReminder && !isLoading && (
        <ReminderNotification daysSinceLastExport={daysSinceLastExport} onGoToSettings={() => setActiveTab('settings')} onDismiss={handleReminderDismiss} />
      )}
      <div className="p-0 sm:p-4">
        <MainView />
         {editingQuestion && (
           <QuestionEditModal question={editingQuestion} onSave={saveQuestionEdit} onCancel={() => setEditingQuestion(null)} formatDate={formatDate} />
         )}
      </div>
      <div id="notification-area" className="fixed bottom-4 right-4 z-30"></div>
    </div>
  );
}

export default App;
