// src/components/widgets/StudyProgressWidget.js
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import './Widget.css';

const StudyProgressWidget = ({ subjects }) => {
  const data = useMemo(() => {
    if (!Array.isArray(subjects)) return [];
    
    return subjects.map(subject => {
      const totalQuestions = subject.chapters?.reduce((sum, chapter) => 
        sum + (chapter.questions?.length || 0), 0) || 0;
      
      let answeredQuestions = 0;
      subject.chapters?.forEach(chapter => {
        chapter.questions?.forEach(question => {
          if (question.answerCount && question.answerCount > 0) {
            answeredQuestions++;
          }
        });
      });
      
      const progressPercent = totalQuestions > 0 
        ? Math.round((answeredQuestions / totalQuestions) * 100) 
        : 0;
      
      return {
        name: subject.name || subject.subjectName || '未分類',
        progress: progressPercent,
      };
    }).sort((a, b) => b.progress - a.progress);
  }, [subjects]);

  return (
    <div className="widget">
      <div className="widget-header">
        <h3>
          <TrendingUp size={18} className="widget-icon" />
          科目別進捗
        </h3>
      </div>
      <div className="widget-content">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${value}%`, '進捗率']} />
              <Bar dataKey="progress" fill="#4f46e5" barSize={12} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="widget-empty-state">データがありません</div>
        )}
      </div>
    </div>
  );
};

export default StudyProgressWidget;
