// src/components/widgets/StudyCalendarWidget.js
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { CalendarDays } from 'lucide-react';
import './Widget.css';

const StudyCalendarWidget = ({ answerHistory, formatDate }) => {
  const calendarData = useMemo(() => {
    if (!Array.isArray(answerHistory)) return [];
    
    // 最近30日間のデータを計算
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);
    
    // 日付ごとの解答数を集計する辞書を初期化
    const dailyCounts = {};
    
    // 過去30日間の各日付を初期化
    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyCounts[dateKey] = { date: new Date(d), count: 0, correct: 0 };
    }
    
    // 解答履歴から集計
    answerHistory.forEach(record => {
      if (!record.timestamp) return;
      
      const recordDate = new Date(record.timestamp);
      recordDate.setHours(0, 0, 0, 0);
      
      if (recordDate >= thirtyDaysAgo && recordDate <= today) {
        const dateKey = recordDate.toISOString().split('T')[0];
        
        if (dailyCounts[dateKey]) {
          dailyCounts[dateKey].count++;
          if (record.isCorrect) {
            dailyCounts[dateKey].correct++;
          }
        }
      }
    });
    
    // 配列に変換して返す
    return Object.values(dailyCounts).map(item => ({
      date: formatDate(item.date),
      count: item.count,
      correctRate: item.count > 0 ? Math.round((item.correct / item.count) * 100) : 0
    }));
  }, [answerHistory, formatDate]);

  return (
    <div className="widget">
      <div className="widget-header">
        <h3>
          <CalendarDays size={18} className="widget-icon" />
          学習カレンダー (30日間)
        </h3>
      </div>
      <div className="widget-content">
        {calendarData.length > 0 && calendarData.some(day => day.count > 0) ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={calendarData} margin={{ top: 5, right: 30, left: 20, bottom: 45 }}>
              <XAxis 
                dataKey="date" 
                angle={-45} 
                textAnchor="end" 
                height={70}
                interval={Math.ceil(calendarData.length / 15)}
                tick={{ fontSize: 10 }}
              />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, name === 'count' ? '解答数' : '正解率 (%)']} />
              <Bar dataKey="count" name="解答数" fill="#818cf8" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="widget-empty-state">
            過去30日間の学習データがありません
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyCalendarWidget;
