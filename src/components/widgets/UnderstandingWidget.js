// src/components/widgets/UnderstandingWidget.js
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CheckCircle } from 'lucide-react';
import './Widget.css';

const UnderstandingWidget = ({ subjects }) => {
  const data = useMemo(() => {
    if (!Array.isArray(subjects)) return [];
    
    let understandingCounts = { '理解○': 0, '曖昧△': 0, '理解できていない×': 0, '未解答': 0 };
    
    subjects.forEach(subject => {
      subject.chapters?.forEach(chapter => {
        chapter.questions?.forEach(question => {
          if (question.answerCount && question.answerCount > 0) {
            const understanding = question.understanding || '未解答';
            const baseUnderstanding = understanding.split(':')[0];
            
            if (baseUnderstanding === '理解○') {
              understandingCounts['理解○']++;
            } else if (baseUnderstanding.startsWith('曖昧△')) {
              understandingCounts['曖昧△']++;
            } else if (baseUnderstanding === '理解できていない×') {
              understandingCounts['理解できていない×']++;
            } else {
              understandingCounts['未解答']++;
            }
          } else {
            understandingCounts['未解答']++;
          }
        });
      });
    });
    
    return [
      { name: '理解○', value: understandingCounts['理解○'], color: '#10b981' },
      { name: '曖昧△', value: understandingCounts['曖昧△'], color: '#f59e0b' },
      { name: '理解できていない×', value: understandingCounts['理解できていない×'], color: '#ef4444' },
      { name: '未解答', value: understandingCounts['未解答'], color: '#9ca3af' }
    ].filter(item => item.value > 0);
  }, [subjects]);

  return (
    <div className="widget">
      <div className="widget-header">
        <h3>
          <CheckCircle size={18} className="widget-icon" />
          理解度の分布
        </h3>
      </div>
      <div className="widget-content">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}問`, '問題数']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="widget-empty-state">データがありません</div>
        )}
      </div>
    </div>
  );
};

export default UnderstandingWidget;
