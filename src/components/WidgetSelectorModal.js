// src/components/WidgetSelectorModal.js
import React, { useState, useEffect } from 'react';
import { X, Save, Info } from 'lucide-react';
import styles from './WidgetSelectorModal.module.css'; // CSSモジュールを作成

const WidgetSelectorModal = ({ isOpen, onClose, availableWidgets, activeWidgets, onSave }) => {
  // モーダル内で選択状態を管理するためのローカルstate
  const [selectedWidgetIds, setSelectedWidgetIds] = useState(activeWidgets || []);

  // activeWidgets (props) が変更されたらローカルstateも更新
  useEffect(() => {
    setSelectedWidgetIds(activeWidgets || []);
  }, [activeWidgets]);

  // チェックボックス変更ハンドラ
  const handleCheckboxChange = (event) => {
    const { value, checked } = event.target;
    if (checked) {
      // チェックされたらIDを追加
      setSelectedWidgetIds(prev => [...prev, value]);
    } else {
      // チェックが外れたらIDを削除
      setSelectedWidgetIds(prev => prev.filter(id => id !== value));
    }
  };

  // 保存ボタンクリックハンドラ
  const handleSaveClick = () => {
    onSave(selectedWidgetIds); // App.jsの更新関数を呼び出す
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>表示ウィジェット管理</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* コンテンツ (ウィジェットリスト) */}
        <div className={styles.content}>
          <p className={styles.description}>
            ダッシュボードに表示したいウィジェットを選択してください。
          </p>
          <ul className={styles.widgetList}>
            {availableWidgets.map(widget => (
              <li key={widget.id} className={styles.widgetItem}>
                <label className={styles.widgetLabel}>
                  <input
                    type="checkbox"
                    value={widget.id}
                    checked={selectedWidgetIds.includes(widget.id)}
                    onChange={handleCheckboxChange}
                    className={styles.checkbox}
                  />
                  <span className={styles.widgetName}>{widget.name}</span>
                  {/* ツールチップや説明アイコンを追加しても良い */}
                  {widget.description && (
                     <span className={styles.tooltipContainer} title={widget.description}>
                       <Info size={14} className={styles.infoIcon} />
                     </span>
                  )}
                   {widget.isNew && <span className={styles.newBadge}>NEW</span>}
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* フッター */}
        <div className={styles.footer}>
          <button onClick={onClose} className={`${styles.footerButton} ${styles.cancelButton}`}>
            キャンセル
          </button>
          <button onClick={handleSaveClick} className={`${styles.footerButton} ${styles.saveButton}`}>
            <Save size={16} /> 保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetSelectorModal;
