// src/components/widgets/UpcomingReviewsWidget.js
import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import './Widget.css';

const UpcomingReviewsWidget = ({ subjects, formatDate }) => {
  const upcomingReviews = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    // 今後7日分の復習予定を取得
    const reviewsByDay = {};
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // 日付のキーを生成 (YYYY-MM-DD形式)
      const dateKey = date.toISOString().split('T')[0];
      reviewsByDay[dateKey] = [];
    }
    
    // 問題ごとに次回復習日をチェック
    subjects.forEach(subject => {
      const subjectName = subject.name || subject.subjectName || '未分類';
      
      subject.chapters?.forEach(chapter => {
        const chapterName = chapter.name || chapter.chapterName || '未分類';
        
        chapter.questions?.forEach(question => {
          if (!question.nextDate) return;
          
          const nextDate = new Date(question.nextDate);
          if (isNaN(nextDate.getTime())) return;
          
          nextDate.setHours(0, 0, 0, 0);
          
          // 今日から1週間以内かチェック
          if (nextDate >= today && nextDate <= nextWeek) {
            const dateKey = nextDate.toISOString().split('T')[0];
            
            if (reviewsByDay[dateKey]) {
              reviewsByDay[dateKey].push({
                id: question.id,
                subjectName,
                chapterName
              });
            }
          }
        });
      });
    });
    
    // 配列に変換
    return Object.keys(reviewsByDay).map(dateKey => {
      const date = new Date(dateKey);
      return {
        date,
        formattedDate: formatDate(date),
        questions: reviewsByDay[dateKey],
        count: reviewsByDay[dateKey].length
      };
    });
  }, [subjects, formatDate]);

  return (
    <div className="widget">
      <div className="widget-header">
        <h3>
          <Calendar size={18} className="widget-icon" />
          今後の復習予定
        </h3>
      </div>
      <div className="widget-content">
        {upcomingReviews.some(day => day.count > 0) ? (
          <div className="upcoming-reviews-list">
            {upcomingReviews.map(day => (
              <div key={day.formattedDate} className="upcoming-day">
                <div className="upcoming-day-header">
                  <span className="upcoming-day-date">{day.formattedDate}</span>
                  <span className="upcoming-day-count">{day.count}問</span>
                </div>
                
                {day.count > 0 && (
                  <div className="upcoming-questions">
                    {day.questions.slice(0, 3).map(question => (
                      <div key={question.id} className="upcoming-question-item">
                        <span className="upcoming-question-id">{question.id}</span>
                        <span className="upcoming-question-subject">{question.subjectName}</span>
                      </div>
                    ))}
                    {day.count > 3 && (
                      <div className="upcoming-more">他 {day.count - 3} 問</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="widget-empty-state">
            次の7日間に予定されている復習はありません
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingReviewsWidget;
