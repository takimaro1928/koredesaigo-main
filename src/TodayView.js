// src/TodayView.js
// CSS Modules 適用版

import React, { useState } from 'react';
import { Check, X, AlertTriangle, ChevronsUpDown } from 'lucide-react';
import styles from './TodayView.module.css'; // ★ CSSモジュールをインポート

const TodayView = ({ todayQuestions, recordAnswer, formatDate }) => {
  const [expandedAmbiguousId, setExpandedAmbiguousId] = useState(null);
  const [questionStates, setQuestionStates] = useState({});

  // --- ハンドラ関数群 (変更なし) ---
  const handleAnswerClick = (questionId, isCorrect) => {
    if (isCorrect) {
      setQuestionStates(prev => ({ ...prev, [questionId]: { showComprehension: true } }));
    } else {
      recordAnswer(questionId, false, '理解できていない×');
      setQuestionStates(prev => { const newState = {...prev}; delete newState[questionId]; return newState; });
    }
  };
  const handleAmbiguousClick = (questionId) => {
    setExpandedAmbiguousId(prevId => (prevId === questionId ? null : questionId));
  };
  const selectAmbiguousReason = (questionId, reason) => {
    recordAnswer(questionId, true, `曖昧△:${reason}`);
    setExpandedAmbiguousId(null);
     setQuestionStates(prev => { const newState = {...prev}; delete newState[questionId]; return newState; });
  };
  const handleUnderstandClick = (questionId) => {
    recordAnswer(questionId, true, '理解○');
     setQuestionStates(prev => { const newState = {...prev}; delete newState[questionId]; return newState; });
  };
   const getQuestionState = (questionId) => {
    return questionStates[questionId] || { showComprehension: false };
  };
  const ambiguousReasons = [
    '偶然正解した', '正解の選択肢は理解していたが、他の選択肢の意味が分かっていなかった', '合っていたが、別の理由を思い浮かべていた',
    '自信はなかったけど、これかなとは思っていた', '問題を覚えてしまっていた', 'その他'
  ];

  // --- JSX 部分 ---
  // ★ className を styles オブジェクトから参照するように変更 ★
  return (
    <div className={styles.todayContainer}> {/* ★ */}
      <h2 className={styles.todayTitleContainer}> {/* ★ */}
        <span>今日解く問題</span>
        <span className={styles.todayDateBadge}> {/* ★ */}
          {formatDate(new Date())}
        </span>
      </h2>

      {!todayQuestions || todayQuestions.length === 0 ? (
        <div className={styles.todayEmptyCard}> {/* ★ */}
          <p>今日解く問題はありません 🎉</p>
          <p>素晴らしい！ゆっくり休んでください。</p>
        </div>
      ) : (
        <div className={styles.todayList}> {/* ★ */}
          {todayQuestions.map(question => {
            if (!question || !question.id) {
                console.warn("Rendering invalid question data:", question);
                return null;
            }
            const questionState = getQuestionState(question.id);
            const isAmbiguousPanelOpen = expandedAmbiguousId === question.id;

            return (
              <div key={question.id} className={styles.todayCard}> {/* ★ */}
                <div className={styles.todayCardContent}> {/* ★ */}
                  <div className={styles.todayCardSubject}>{question.subjectName || question.subject?.name || '?'}</div> {/* ★ */}
                  <div className={styles.todayCardChapter}>{question.chapterName || question.chapter?.name || '?'}</div> {/* ★ */}
                  <div className={styles.todayCardQidBadge}> {/* ★ */}
                    問題 {question.id}
                  </div>

                  {/* --- 正誤ボタンエリア --- */}
                  {!questionState.showComprehension && (
                    <div>
                      <div className={styles.todaySectionLabel}>解答結果</div> {/* ★ */}
                      <div className={styles.todayButtonGrid}> {/* ★ */}
                        <button
                          onClick={() => handleAnswerClick(question.id, true)}
                          className={`${styles.todayButton} ${styles.todayButtonCorrect}`} /* ★ */
                        >
                          <Check /> 正解
                        </button>
                        <button
                          onClick={() => handleAnswerClick(question.id, false)}
                          className={`${styles.todayButton} ${styles.todayButtonIncorrect}`} /* ★ */
                        >
                          <X /> 不正解
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- 理解度ボタンエリア --- */}
                  {questionState.showComprehension && (
                    <div>
                      <div className={styles.todaySectionLabel}>理解度を選択</div> {/* ★ */}
                      <div className={styles.todayButtonGrid}> {/* ★ */}
                        <button
                          onClick={() => handleUnderstandClick(question.id)}
                          className={`${styles.todayButton} ${styles.todayButtonUnderstood}`} /* ★ */
                        >
                          <Check /> 理解済み
                        </button>
                        <button
                          onClick={() => handleAmbiguousClick(question.id)}
                          className={`${styles.todayButton} ${styles.todayButtonAmbiguous} ${isAmbiguousPanelOpen ? styles.open : ''}`} /* ★ */
                        >
                          <div style={{display: 'flex', alignItems: 'center'}}>
                            <AlertTriangle/>
                            <span>曖昧</span>
                          </div>
                          <ChevronsUpDown className={styles.todayButtonDropdownIcon} /> {/* ★ */}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- 曖昧理由選択パネル --- */}
                {isAmbiguousPanelOpen && (
                  <div className={styles.reasonPanelContainer}> {/* ★ */}
                     <div className={styles.reasonPanel}> {/* ★ */}
                       <div className={styles.reasonPanelHeader}> {/* ★ */}
                         <div className={styles.reasonPanelTitle}>曖昧だった理由を選択してください:</div> {/* ★ */}
                       </div>
                       <div className={styles.reasonPanelOptions}> {/* ★ */}
                         {ambiguousReasons.map((reason, index) => (
                           <button
                             key={index}
                             onClick={() => selectAmbiguousReason(question.id, reason)}
                             className={styles.reasonOption} /* ★ */
                           >
                             <div className={styles.reasonOptionContent}> {/* ★ */}
                               <span className={styles.reasonOptionDot}></span> {/* ★ */}
                               <span className={styles.reasonOptionText}>{reason}</span> {/* ★ */}
                             </div>
                             <span className={styles.reasonOptionBadge}>8日後</span> {/* ★ */}
                           </button>
                         ))}
                       </div>
                     </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TodayView;
