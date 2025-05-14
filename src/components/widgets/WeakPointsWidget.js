// src/components/widgets/WeakPointsWidget.js
import React, { useMemo } from 'react';
import { Zap, ArrowUpDown } from 'lucide-react';
import './Widget.css';

const WeakPointsWidget = ({ subjects }) => {
  const weakPointsList = useMemo(() => {
    const weakPoints = [];
    
    subjects.forEach(subject => {
      const subjectName = subject.name || subject.subjectName || '未分類';
      
      subject.chapters?.forEach(chapter => {
        const chapterName = chapter.name || chapter.chapterName || '未分類';
        
        chapter.questions?.forEach(question => {
          // 苦手問題の条件: 正解率が50%未満、かつ解答回数が3回以上
          if (question.correctRate < 50 && question.answerCount >= 3) {
            weakPoints.push({
              id: question.id,
              subjectName,
              chapterName,
              correctRate: question.correctRate || 0,
              answerCount: question.answerCount || 0
            });
          }
        });
      });
    });
    
    // 正解率の低い順に並べ替え
    return weakPoints.sort((a, b) => a.correctRate - b.correctRate).slice(0, 5);
  }, [subjects]);

  return (
    <div className="widget">
      <div className="widget-header">
        <h3>
          <Zap size={18} className="widget-icon" />
          苦手問題 TOP5
        </h3>
      </div>
      <div className="widget-content">
        {weakPointsList.length > 0 ? (
          <div className="weak-points-list">
            <div className="weak-points-header">
              <div className="weak-points-cell">問題ID</div>
              <div className="weak-points-cell">科目</div>
              <div className="weak-points-cell">
                正解率
                <ArrowUpDown size={12} className="sort-icon" />
              </div>
            </div>
            
            {weakPointsList.map(question => (
              <div key={question.id} className="weak-points-row">
                <div className="weak-points-cell">{question.id}</div>
                <div className="weak-points-cell">{question.subjectName}</div>
                <div className="weak-points-cell">
                  <div className="rate-bar-container">
                    <div className="rate-bar">
                      <div 
                        className="rate-bar-inner rate-bar-red" 
                        style={{ width: `${question.correctRate}%` }}
                      ></div>
                    </div>
                    <span className="rate-text">{question.correctRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="widget-empty-state">
            苦手問題がありません
          </div>
        )}
      </div>
    </div>
  );
};

export default WeakPointsWidget;
