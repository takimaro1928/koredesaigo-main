// src/components/Dashboard.js
// ウィジェット管理機能の追加 (完全版 v2)

import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './Dashboard.css';
import { Settings } from 'lucide-react';

// --- ウィジェットコンポーネントのインポート ---
import UnderstandingWidget from './widgets/UnderstandingWidget';
import StudyProgressWidget from './widgets/StudyProgressWidget';
import WeakPointsWidget from './widgets/WeakPointsWidget';
import UpcomingReviewsWidget from './widgets/UpcomingReviewsWidget';
import StudyCalendarWidget from './widgets/StudyCalendarWidget';
// --- ↓↓ 新規ウィジェット用のインポート (コンポーネント作成後に有効化) ↓↓ ---
// import TodaySummaryWidget from './widgets/TodaySummaryWidget'; // 例
// import TimeAnalysisWidget from './widgets/TimeAnalysisWidget'; // 例
// import RecentAnswersWidget from './widgets/RecentAnswersWidget'; // 例
// import UnderstandingTrendWidget from './widgets/UnderstandingTrendWidget'; // 例

// --- ウィジェット選択モーダル ---
import WidgetSelectorModal from './WidgetSelectorModal'; // 作成したモーダルをインポート

const ResponsiveGridLayout = WidthProvider(Responsive);

// --- ウィジェットIDとコンポーネントのマッピング ---
const widgetComponentMap = {
  understanding: UnderstandingWidget,
  progress: StudyProgressWidget,
  weakpoints: WeakPointsWidget,
  upcoming: UpcomingReviewsWidget,
  calendar: StudyCalendarWidget,
  // todaySummary: TodaySummaryWidget, // 新規ウィジェットを後で追加
  // timeAnalysis: TimeAnalysisWidget,
  // recentAnswers: RecentAnswersWidget,
  // understandingTrend: UnderstandingTrendWidget,
};

// デフォルトレイアウト定義
const defaultLayouts = {
    lg: [ { i: 'understanding', x: 0, y: 0, w: 6, h: 4 }, { i: 'progress', x: 6, y: 0, w: 6, h: 4 }, { i: 'weakpoints', x: 0, y: 4, w: 6, h: 6 }, { i: 'upcoming', x: 6, y: 4, w: 6, h: 6 }, { i: 'calendar', x: 0, y: 10, w: 12, h: 6 } ],
    md: [ { i: 'understanding', x: 0, y: 0, w: 6, h: 4 }, { i: 'progress', x: 6, y: 0, w: 6, h: 4 }, { i: 'weakpoints', x: 0, y: 4, w: 6, h: 6 }, { i: 'upcoming', x: 6, y: 4, w: 6, h: 6 }, { i: 'calendar', x: 0, y: 10, w: 12, h: 6 } ],
    sm: [ { i: 'understanding', x: 0, y: 0, w: 6, h: 4 }, { i: 'progress', x: 0, y: 4, w: 6, h: 4 }, { i: 'weakpoints', x: 0, y: 8, w: 6, h: 6 }, { i: 'upcoming', x: 0, y: 14, w: 6, h: 6 }, { i: 'calendar', x: 0, y: 20, w: 6, h: 6 } ],
    xs: [ { i: 'understanding', x: 0, y: 0, w: 4, h: 4 }, { i: 'progress', x: 0, y: 4, w: 4, h: 4 }, { i: 'weakpoints', x: 0, y: 8, w: 4, h: 6 }, { i: 'upcoming', x: 0, y: 14, w: 4, h: 6 }, { i: 'calendar', x: 0, y: 20, w: 4, h: 6 } ]
};

// Props に activeWidgets, availableWidgets, onActiveWidgetsChange を追加
const Dashboard = ({
    subjects,
    answerHistory,
    formatDate,
    layouts: initialLayouts,
    onLayoutChange,
    activeWidgets = [],
    availableWidgets = [],
    onActiveWidgetsChange
}) => {

  const [layouts, setLayouts] = useState(initialLayouts || defaultLayouts);
  const [isSelectorModalOpen, setIsSelectorModalOpen] = useState(false);

  useEffect(() => {
    if (initialLayouts && JSON.stringify(initialLayouts) !== JSON.stringify(layouts)) {
        setLayouts(initialLayouts);
    }
    else if (!initialLayouts && !layouts) {
        setLayouts(defaultLayouts);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLayouts]);

  const handleLayoutChange = (currentLayout, allLayouts) => {
    if (JSON.stringify(allLayouts) !== JSON.stringify(layouts)) {
        setLayouts(allLayouts);
        if (onLayoutChange) {
            onLayoutChange(currentLayout, allLayouts);
        } else {
            console.warn("Dashboard: onLayoutChange prop is missing.");
        }
    }
  };

  const resetLayout = () => {
    setLayouts(defaultLayouts);
     if (onLayoutChange) { onLayoutChange(null, defaultLayouts); }
     else { console.warn("Dashboard: onLayoutChange prop is missing for reset."); }
  };

  const openWidgetSelector = () => { setIsSelectorModalOpen(true); };
  const closeWidgetSelector = () => { setIsSelectorModalOpen(false); };

  const handleWidgetSelectionSave = (newActiveWidgetIds) => {
      if (onActiveWidgetsChange) { onActiveWidgetsChange(newActiveWidgetIds); }
      closeWidgetSelector();
  };

  // 表示するウィジェットをフィルタリング
  const widgetsToRender = availableWidgets.filter(widget =>
      activeWidgets.includes(widget.id) && widgetComponentMap[widget.id]
  );

  // 表示するウィジェットに対応するレイアウトのみをフィルタリング
  const currentLayoutsForActiveWidgets = {};
  if(layouts) {
      for (const breakpoint in layouts) {
          if (Object.hasOwnProperty.call(layouts, breakpoint)) {
              // layouts[breakpoint] が配列であることを確認
              if(Array.isArray(layouts[breakpoint])) {
                  currentLayoutsForActiveWidgets[breakpoint] = layouts[breakpoint].filter(layoutItem =>
                      activeWidgets.includes(layoutItem.i)
                  );
              } else {
                  console.warn(`Layouts for breakpoint ${breakpoint} is not an array:`, layouts[breakpoint]);
                  currentLayoutsForActiveWidgets[breakpoint] = []; // エラー回避のため空配列
              }
          }
      }
  } else {
      console.warn("Layouts data is missing or invalid.");
  }


  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>学習ダッシュボード</h2>
        <div className="dashboard-actions">
            <button onClick={openWidgetSelector} className="manage-widgets-button" title="表示ウィジェットを管理">
                <Settings size={18} />
                <span>管理</span>
            </button>
            <button onClick={resetLayout} className="reset-layout-button">
                レイアウトをリセット
            </button>
        </div>
      </div>

      {/* layouts にはフィルタリングしたものを渡す */}
      <ResponsiveGridLayout
        className="layout"
        layouts={currentLayoutsForActiveWidgets}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 12, sm: 6, xs: 4 }}
        rowHeight={60}
        onLayoutChange={handleLayoutChange}
        isDraggable
        isResizable
        // key={JSON.stringify(activeWidgets)} // ウィジェット構成が変わったら再マウントを強制 (任意)
      >
        {widgetsToRender.map(widgetInfo => {
            const WidgetComponent = widgetComponentMap[widgetInfo.id];
            // 各ウィジェットが必要とするpropsを定義
            const commonProps = { subjects, answerHistory, formatDate };
            let specificProps = {};
            switch (widgetInfo.id) {
                case 'understanding': specificProps = { subjects }; break;
                case 'progress': specificProps = { subjects }; break;
                case 'weakpoints': specificProps = { subjects }; break;
                case 'upcoming': specificProps = { subjects, formatDate }; break;
                case 'calendar': specificProps = { answerHistory, formatDate }; break;
                // 新規ウィジェットのpropsもここに追加
                default: break;
            }

            // react-grid-layout の子要素として直接コンポーネントを配置
            return (
                <div key={widgetInfo.id} className="widget-container">
                    <WidgetComponent {...commonProps} {...specificProps} />
                </div>
            );
        })}
      </ResponsiveGridLayout>

      {isSelectorModalOpen && (
          <WidgetSelectorModal
              isOpen={isSelectorModalOpen}
              onClose={closeWidgetSelector}
              availableWidgets={availableWidgets}
              activeWidgets={activeWidgets}
              onSave={handleWidgetSelectionSave}
          />
      )}
    </div>
  );
};

export default Dashboard;
