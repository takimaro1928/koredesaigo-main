// src/SettingsPage.js
import React, { useState, useRef, useCallback } from 'react';
import { 
  Settings, Trash2, AlertTriangle, RefreshCw, 
  DownloadCloud, UploadCloud, Check, X, FileText, FileClock, ListChecks, Database, History, Info
} from 'lucide-react';
import styles from './SettingsPage.module.css';
import PropTypes from 'prop-types';

const SettingsPage = ({ 
  onResetData, 
  onResetAnswerStatusOnly,
  onDataImport,       // 新規: インポート関数
  onDataExport,       // JSONエクスポート関数
  onCsvDataExport,    // CSVエクスポート関数 (新規)
  onCsvDataImport,    // CSVインポート関数 (新規)
  onAnswerHistoryCsvExport, // 解答履歴CSVエクスポート用 (新規)
  onQuestionIdOnlyCsvExport, // 問題IDのみCSVエクスポート用 (新規)
  onAnswerHistoryCsvImport, // 新しいプロパティ
  onFullDataCsvExport,  // 新しいプロパティ
  onFullDataCsvImport,  // 新しいプロパティ
  onAnswerHistoryJsonExport, // 新しいプロパティ
  onAnswerHistoryJsonImport, // 新しいプロパティ
  onQuestionIdOnlyJsonExport, // ★ 新しいプロパティ
  onQuestionListJsonExport, // ★ 問題リストJSONエクスポート用
  subjects = [],      // 新規: エクスポート用の科目データ
  answerHistory = []  // 新規: エクスポート用の解答履歴
}) => {
  // リセットボタンのハンドラはそのまま
  const handleResetClick = () => {
    // 既存のコード
    const confirmReset = window.confirm(
      "本当にすべての学習データ（解答履歴含む）をリセットしますか？\nこの操作は元に戻せません。"
    );
    
    if (confirmReset) {
      console.log("データリセットを実行します。");
      onResetData();
    } else {
      console.log("データリセットはキャンセルされました。");
    }
  };

  // 回答状況のみリセットボタンのハンドラ
  const handleResetAnswerStatusOnly = () => {
    console.log("回答状況のみリセットを実行します。");
    onResetAnswerStatusOnly();
  };

  // 新規: インポート関連の状態
  const [jsonImportFile, setJsonImportFile] = useState(null);
  const [jsonImportError, setJsonImportError] = useState('');
  const [jsonImportSuccess, setJsonImportSuccess] = useState('');
  const jsonFileInputRef = useRef(null); // ファイル入力要素の参照

  // CSVインポート関連の状態 (新規)
  const [csvImportFile, setCsvImportFile] = useState(null);
  const [csvImportError, setCsvImportError] = useState('');
  const [csvImportSuccess, setCsvImportSuccess] = useState('');
  const csvFileInputRef = useRef(null);

  // 解答履歴CSVインポート用のstate
  const [historyCsvImportFile, setHistoryCsvImportFile] = useState(null);
  const [historyCsvImportError, setHistoryCsvImportError] = useState('');
  const [historyCsvImportSuccess, setHistoryCsvImportSuccess] = useState('');
  const historyCsvFileInputRef = useRef(null);

  // 全データCSVインポート用のstate
  const [fullCsvImportFile, setFullCsvImportFile] = useState(null);
  const [fullCsvImportError, setFullCsvImportError] = useState('');
  const [fullCsvImportSuccess, setFullCsvImportSuccess] = useState('');
  const fullCsvFileInputRef = useRef(null);

  // 解答履歴JSONインポート用のstate
  const [answerHistoryJsonImportFile, setAnswerHistoryJsonImportFile] = useState(null);
  const [answerHistoryJsonImportError, setAnswerHistoryJsonImportError] = useState('');
  const [answerHistoryJsonImportSuccess, setAnswerHistoryJsonImportSuccess] = useState('');
  const answerHistoryJsonFileInputRef = useRef(null);

  // エクスポート機能のハンドラ
  const handleExportData = () => {
    try {
      // エクスポートするデータの準備
      const exportData = {
        exportDate: new Date().toISOString(),
        appVersion: "1.0.0", // アプリのバージョン（任意）
        subjects: subjects,
        answerHistory: answerHistory
      };
      
      // JSONに変換
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Blobオブジェクトを作成
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // ダウンロードリンクを作成
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // ファイル名設定（日付を含む）
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `study-scheduler-data-${dateStr}.json`;
      
      // ダウンロードを実行
      document.body.appendChild(link);
      link.click();
      
      // 後片付け
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log("データエクスポート完了");
    } catch (error) {
      console.error("エクスポート処理中にエラー:", error);
      alert("エクスポート中にエラーが発生しました。");
    }
  };

  // ファイル選択時のハンドラ
  const handleJsonFileChange = (e) => {
    const file = e.target.files[0];
    setJsonImportFile(file);
    setJsonImportError('');
    setJsonImportSuccess('');
    if (jsonFileInputRef.current) jsonFileInputRef.current.value = null; // ファイル選択をクリア
  };

  // CSVファイル選択時のハンドラ (新規)
  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    setCsvImportFile(file);
    setCsvImportError('');
    setCsvImportSuccess('');
    if (csvFileInputRef.current) csvFileInputRef.current.value = null;
  };

  // インポート実行のハンドラ
  const handleImportJsonData = () => {
    if (!jsonImportFile) {
      setJsonImportError('ファイルを選択してください');
      setJsonImportSuccess('');
      return;
    }
    if (jsonImportFile.size > 10 * 1024 * 1024) {
      setJsonImportError('ファイルサイズが大きすぎます（上限: 10MB）');
      setJsonImportSuccess('');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!importedData.subjects) {
          setJsonImportError('無効なJSONファイル形式です。');
          setJsonImportSuccess('');
          return;
        }
        // App.jsから渡される onDataImport は Promise を返す想定
        const success = await onDataImport(importedData);
        if (success) {
          setJsonImportSuccess('JSONデータのインポートに成功しました。');
          setJsonImportError('');
          setJsonImportFile(null);
          if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
        } else {
          setJsonImportError('JSONデータのインポートに失敗しました。');
          setJsonImportSuccess('');
        }
      } catch (error) {
        setJsonImportError(`JSONファイルの解析エラー: ${error.message}`);
        setJsonImportSuccess('');
      }
    };
    reader.onerror = () => {
      setJsonImportError('ファイルの読み込みに失敗しました。');
      setJsonImportSuccess('');
    };
    reader.readAsText(jsonImportFile);
  };

  // CSVインポート実行のハンドラ (新規)
  const handleImportCsvData = async () => {
    if (!csvImportFile) {
      setCsvImportError('CSVファイルを選択してください');
      setCsvImportSuccess('');
      return;
    }
    setCsvImportError('');
    setCsvImportSuccess('問題リストCSVをインポート処理中...');
    try {
      const csvString = await csvImportFile.text();
      const success = await onCsvDataImport(csvString); // onCsvDataImport が Promise を返すと仮定
      if (success) {
        setCsvImportSuccess('問題リストCSVのインポートに成功しました。');
        setCsvImportError('');
        setCsvImportFile(null);
        if (csvFileInputRef.current) csvFileInputRef.current.value = '';
      } else {
        setCsvImportError('問題リストCSVのインポートに失敗しました。ファイル形式や内容を確認してください。');
        setCsvImportSuccess('');
      }
    } catch (error) {
      setCsvImportError(`問題リストCSVの処理エラー: ${error.message}`);
      setCsvImportSuccess('');
    }
  };

  // 解答履歴CSVファイル選択ハンドラ
  const handleHistoryCsvFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/csv") {
      setHistoryCsvImportFile(file);
      setHistoryCsvImportError('');
      setHistoryCsvImportSuccess('');
    } else {
      setHistoryCsvImportFile(null);
      setHistoryCsvImportError('CSVファイルを選択してください。');
      setHistoryCsvImportSuccess('');
    }
    if (historyCsvFileInputRef.current) historyCsvFileInputRef.current.value = null;
  };

  // 解答履歴CSVインポート実行ハンドラ
  const handleImportHistoryCsv = useCallback(async () => {
    if (!historyCsvImportFile) {
      setHistoryCsvImportError('解答履歴CSVファイルを選択してください。');
      setHistoryCsvImportSuccess('');
      return;
    }
    setHistoryCsvImportError('');
    setHistoryCsvImportSuccess('解答履歴CSVをインポート処理中...');
    try {
      const fileContent = await historyCsvImportFile.text();
      const result = await onAnswerHistoryCsvImport(fileContent);
      if (result && result.success) {
        setHistoryCsvImportSuccess(result.message || '解答履歴CSVのインポートに成功しました。');
        setHistoryCsvImportError('');
        if (historyCsvFileInputRef.current) historyCsvFileInputRef.current.value = '';
        setHistoryCsvImportFile(null);
      } else {
        setHistoryCsvImportError(result.message || '解答履歴CSVのインポートに失敗しました。');
        setHistoryCsvImportSuccess('');
      }
    } catch (error) {
      setHistoryCsvImportError(`解答履歴CSVのインポートエラー: ${error.message}`);
      setHistoryCsvImportSuccess('');
    }
  }, [historyCsvImportFile, onAnswerHistoryCsvImport]);

  // 全データCSVファイル選択ハンドラ
  const handleFullCsvFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/csv") {
      setFullCsvImportFile(file);
      setFullCsvImportError('');
      setFullCsvImportSuccess('');
    } else {
      setFullCsvImportFile(null);
      setFullCsvImportError('CSVファイルを選択してください。');
      setFullCsvImportSuccess('');
    }
    if (fullCsvFileInputRef.current) fullCsvFileInputRef.current.value = null;
  };

  // 全データCSVインポート実行ハンドラ
  const handleImportFullCsvData = useCallback(async () => {
    if (!fullCsvImportFile) {
      setFullCsvImportError('全データCSVファイルを選択してください。');
      setFullCsvImportSuccess('');
      return;
    }
    setFullCsvImportError('');
    setFullCsvImportSuccess('全データCSVをインポート処理中...');
    try {
      const fileContent = await fullCsvImportFile.text();
      const result = await onFullDataCsvImport(fileContent); // App.jsの関数を呼び出し
      if (result && result.success) {
        setFullCsvImportSuccess(result.message || '全データCSVのインポートに成功しました。');
        setFullCsvImportError('');
        if (fullCsvFileInputRef.current) fullCsvFileInputRef.current.value = '';
        setFullCsvImportFile(null);
      } else {
        setFullCsvImportError(result.message || '全データCSVのインポートに失敗しました。');
        setFullCsvImportSuccess('');
      }
    } catch (error) {
      setFullCsvImportError(`全データCSVのインポートエラー: ${error.message}`);
      setFullCsvImportSuccess('');
    }
  }, [fullCsvImportFile, onFullDataCsvImport]);

  // 解答履歴JSONファイル選択ハンドラ
  const handleAnswerHistoryJsonFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/json") {
      setAnswerHistoryJsonImportFile(file);
      setAnswerHistoryJsonImportError('');
      setAnswerHistoryJsonImportSuccess('');
    } else {
      setAnswerHistoryJsonImportFile(null);
      setAnswerHistoryJsonImportError('JSONファイルを選択してください。');
      setAnswerHistoryJsonImportSuccess('');
    }
    if (answerHistoryJsonFileInputRef.current) answerHistoryJsonFileInputRef.current.value = null;
  };

  // 解答履歴JSONインポート実行ハンドラ
  const handleImportAnswerHistoryJson = useCallback(async () => {
    if (!answerHistoryJsonImportFile) {
      setAnswerHistoryJsonImportError('解答履歴JSONファイルを選択してください。');
      setAnswerHistoryJsonImportSuccess('');
      return;
    }
    setAnswerHistoryJsonImportError('');
    setAnswerHistoryJsonImportSuccess('解答履歴JSONをインポート処理中...');
    try {
      const fileContent = await answerHistoryJsonImportFile.text();
      const result = await onAnswerHistoryJsonImport(fileContent); // App.jsの関数を呼び出し
      if (result && result.success) {
        setAnswerHistoryJsonImportSuccess(result.message || '解答履歴JSONのインポートに成功しました。');
        setAnswerHistoryJsonImportError('');
        if (answerHistoryJsonFileInputRef.current) answerHistoryJsonFileInputRef.current.value = '';
        setAnswerHistoryJsonImportFile(null);
      } else {
        setAnswerHistoryJsonImportError(result.message || '解答履歴JSONのインポートに失敗しました。');
        setAnswerHistoryJsonImportSuccess('');
      }
    } catch (error) {
      setAnswerHistoryJsonImportError(`解答履歴JSONのインポートエラー: ${error.message}`);
      setAnswerHistoryJsonImportSuccess('');
    }
  }, [answerHistoryJsonImportFile, onAnswerHistoryJsonImport]);

  return (
    <div className={styles.settingsPage}>
      <h1 className={styles.mainTitle}><Settings className={styles.pageIcon} />設定</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><Database className={styles.icon} /> JSONによるバックアップと復元</h2>
        
        {/* 全データ JSON エクスポート・インポート */}
        <div className={styles.subSectionContainer}>
          <h3 className={styles.subSectionTitle}>全データ (JSON)</h3>
          <div className={styles.buttonGroup}>
            <button onClick={onDataExport} className={`${styles.button} ${styles.exportButton}`}>
              <DownloadCloud className={styles.icon} /> 全データをエクスポート (JSON)
            </button>
          </div>
          <div className={styles.importContainer}>
            <h4 className={styles.subSubSectionTitle}>全データをインポート (JSON)</h4>
            <p className={styles.warningText}>
              <AlertTriangle className={`${styles.icon} ${styles.warningIcon}`} />
              現在の全ての学習データと解答履歴が、ファイルの内容で上書きされます。この操作は元に戻せません。事前に現行データのバックアップ（エクスポート）を強く推奨します。
            </p>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleJsonFileChange}
              ref={jsonFileInputRef}
              className={styles.fileInput}
            />
            {jsonImportError && <p className={styles.errorMessage}><X className={styles.msgIcon} />{jsonImportError}</p>}
            {jsonImportSuccess && <p className={styles.successMessage}><Check className={styles.msgIcon} />{jsonImportSuccess}</p>}
            <button 
              onClick={handleImportJsonData}
              disabled={!jsonImportFile}
              className={`${styles.button} ${styles.importButton}`}>
              <UploadCloud className={styles.icon} /> 全データをインポート (JSON)
            </button>
          </div>
        </div>

        <hr className={styles.dividerShort} />

        {/* 問題リストのみ JSON エクスポート */}
        <div className={styles.subSectionContainer}>
          <h3 className={styles.subSectionTitle}>問題リストのみ (JSON)</h3>
          <p className={styles.descriptionText}>
            現在の問題リスト（科目、章、各問題の詳細設定を含む）をJSON形式でエクスポートします。
          </p>
          <div className={styles.buttonGroup}>
            <button onClick={onQuestionListJsonExport} className={`${styles.button} ${styles.exportButton} ${styles.jsonQuestionListExportButton}`}> 
              <ListChecks className={styles.icon} /> 問題リストをエクスポート (JSON)
            </button>
          </div>
          {/* このセクションにはインポート機能は追加しない (全データインポートと重複するため) */}
        </div>

        <hr className={styles.dividerShort} />

        {/* 問題IDリストのみ JSON エクスポート */}
        <div className={styles.subSectionContainer}>
          <h3 className={styles.subSectionTitle}>問題IDリストのみ (JSON)</h3>
          <p className={styles.descriptionText}>
            すべての問題のQuestionIDのリストをJSON形式でエクスポートします。インポート機能はありません。
          </p>
          <div className={styles.buttonGroup}>
            <button onClick={onQuestionIdOnlyJsonExport} className={`${styles.button} ${styles.exportButton} ${styles.jsonIdListExportButton}`}> 
              <ListChecks className={styles.icon} /> 問題IDリストをエクスポート (JSON)
            </button>
          </div>
        </div>

        {/* 解答履歴のみ JSON エクスポート・インポート */}
        <div className={styles.subSectionContainer}>
          <h3 className={styles.subSectionTitle}>解答履歴のみ (JSON)</h3>
          <div className={styles.buttonGroup}>
            <button onClick={onAnswerHistoryJsonExport} className={`${styles.button} ${styles.exportButton} ${styles.jsonHistoryExportButton}`}> 
              <FileClock className={styles.icon} /> 解答履歴をエクスポート (JSON)
            </button>
          </div>
          <div className={styles.importContainer}>
            <h4 className={styles.subSubSectionTitle}>解答履歴をインポート (JSON)</h4>
            <p className={`${styles.warningText} ${styles.criticalWarning}`}>
              <AlertTriangle className={`${styles.icon} ${styles.warningIcon}`} />
              <strong>重要:</strong> この操作を実行すると、既存の全ての解答履歴がJSONファイルの内容で完全に置き換えられます。問題リストは変更されません。この操作は元に戻せません。
            </p>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleAnswerHistoryJsonFileChange} 
              ref={answerHistoryJsonFileInputRef}
              className={styles.fileInput}
            />
            {answerHistoryJsonImportError && <p className={styles.errorMessage}><X className={styles.msgIcon} />{answerHistoryJsonImportError}</p>}
            {answerHistoryJsonImportSuccess && <p className={styles.successMessage}><Check className={styles.msgIcon} />{answerHistoryJsonImportSuccess}</p>}
            <button 
              onClick={handleImportAnswerHistoryJson} 
              disabled={!answerHistoryJsonImportFile}
              className={`${styles.button} ${styles.importButton} ${styles.jsonHistoryImportButton}`}> 
              <UploadCloud className={styles.icon} /> 解答履歴をインポート (JSON)
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><FileText className={styles.icon} /> CSVによるデータ連携</h2>
        <p className={styles.infoText}>
          <Info className={`${styles.icon} ${styles.infoIcon}`} />
          CSVファイル形式で、問題リストや解答履歴をエクスポート・インポートできます。これにより、表計算ソフトでの編集や他のツールとのデータ連携が可能です。
        </p>
        
        <h3 className={styles.subSectionTitle}>CSVエクスポート</h3>
        <div className={`${styles.buttonGroup} ${styles.exportButtonsContainerGrid}`}> 
          <button onClick={onFullDataCsvExport} className={`${styles.button} ${styles.exportButton} ${styles.fullCsvExportButton}`}>
            <DownloadCloud className={styles.icon} /> 全データをエクスポート (CSV)
          </button>
          <button onClick={onCsvDataExport} className={`${styles.button} ${styles.csvExportButton}`}>
            <DownloadCloud className={styles.icon} /> 問題リストをエクスポート (CSV)
          </button>
          <button onClick={onAnswerHistoryCsvExport} className={`${styles.button} ${styles.historyCsvExportButton}`}>
            <FileClock className={styles.icon} /> 解答履歴をエクスポート (CSV)
          </button>
          <button onClick={onQuestionIdOnlyCsvExport} className={`${styles.button} ${styles.idListCsvExportButton}`}>
            <ListChecks className={styles.icon} /> 問題IDリストをエクスポート (CSV)
          </button>
        </div>
        
        <hr className={styles.dividerShort} />

        <h3 className={styles.subSectionTitle}>CSVインポート</h3>
        <div className={styles.importContainer}>
          <h4 className={styles.subSubSectionTitle}>問題リストをインポート (CSV)</h4>
          <p className={styles.descriptionText}>
            CSVファイルから問題リストをインポートします。既存の問題はQuestionIDに基づいて更新され、存在しないQuestionIDの場合は新規に追加されます。QuestionNumberが指定されていないか無効な場合は、章ごとに自動で採番されます。
          </p>
          <p className={styles.warningTextSmall}>
            <AlertTriangle className={`${styles.iconSmall} ${styles.warningIcon}`} />
            インポート前に現在の問題リストをエクスポートしておくことを推奨します。
          </p>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleCsvFileChange} 
            ref={csvFileInputRef}
            className={styles.fileInput}
          />
          {csvImportError && <p className={styles.errorMessage}><X className={styles.msgIcon} />{csvImportError}</p>}
          {csvImportSuccess && <p className={styles.successMessage}><Check className={styles.msgIcon} />{csvImportSuccess}</p>}
          <button 
            onClick={handleImportCsvData} 
            disabled={!csvImportFile}
            className={`${styles.button} ${styles.importButton}`}
          >
            <UploadCloud className={styles.icon} /> 問題リストをインポート (CSV)
          </button>
        </div>

        <div className={styles.importContainer}>
          <h4 className={styles.subSubSectionTitle}>解答履歴をインポート (CSV)</h4>
          <p className={styles.descriptionText}> 
            CSVファイルから解答履歴をインポートします。
          </p>
          <p className={`${styles.warningText} ${styles.criticalWarning}`}>
            <AlertTriangle className={`${styles.icon} ${styles.warningIcon}`} />
            <strong>超重要:</strong> この操作を実行すると、既存の全ての解答履歴がCSVファイルの内容で完全に置き換えられます。この操作は元に戻すことができません。必ず事前に「解答履歴をエクスポート (CSV)」機能を使ってバックアップを取得してください。
          </p>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleHistoryCsvFileChange} 
            ref={historyCsvFileInputRef}
            className={styles.fileInput}
          />
          {historyCsvImportError && <p className={styles.errorMessage}><X className={styles.msgIcon} />{historyCsvImportError}</p>}
          {historyCsvImportSuccess && <p className={styles.successMessage}><Check className={styles.msgIcon} />{historyCsvImportSuccess}</p>}
          <button 
            onClick={handleImportHistoryCsv} 
            disabled={!historyCsvImportFile}
            className={`${styles.button} ${styles.importButton} ${styles.importHistoryButton}`}
          >
            <UploadCloud className={styles.icon} /> 解答履歴をインポート (CSV)
          </button>
        </div>

        {/* 全データCSVインポートセクション */}
        <div className={styles.importContainer} style={{ marginTop: '25px' }}>
          <h4 className={styles.subSubSectionTitle}>全データをインポート (CSV)</h4>
          <p className={`${styles.warningText} ${styles.criticalWarning}`}>
            <AlertTriangle className={`${styles.icon} ${styles.warningIcon}`} />
            <strong>超重要:</strong> この操作を実行すると、現在の問題リストと解答履歴を含む全てのデータがCSVファイルの内容で完全に置き換えられます。この操作は元に戻すことができません。CSVファイルは「全データをエクスポート (CSV)」機能で作成されたものである必要があります。
          </p>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFullCsvFileChange} 
            ref={fullCsvFileInputRef}
            className={styles.fileInput}
          />
          {fullCsvImportError && <p className={styles.errorMessage}><X className={styles.msgIcon} />{fullCsvImportError}</p>}
          {fullCsvImportSuccess && <p className={styles.successMessage}><Check className={styles.msgIcon} />{fullCsvImportSuccess}</p>}
          <button 
            onClick={handleImportFullCsvData} 
            disabled={!fullCsvImportFile}
            className={`${styles.button} ${styles.importButton} ${styles.importFullDataButton}`}>
            <UploadCloud className={styles.icon} /> 全データをインポート (CSV)
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><Trash2 className={styles.icon} /> データリセット</h2>
        <div className={styles.resetOption}>
          <div>
            <h3 className={styles.subSectionTitle}>回答状況のみリセット</h3>
            <p className={styles.descriptionText}>
              問題リスト（問題ID、科目名、章名、問題番号、コメント）は維持したまま、各問題の正解率、最終解答日、次回予定日、解答回数、理解度といった学習進捗のみを初期状態（未学習など）にリセットします。
            </p>
          </div>
          <button onClick={handleResetAnswerStatusOnly} className={`${styles.button} ${styles.resetButtonMinor}`}>
            <RefreshCw className={styles.icon} /> 回答状況のみリセット
          </button>
        </div>
        <hr className={styles.dividerShort} />
        <div className={styles.resetOption}>
          <div>
            <h3 className={styles.subSectionTitle}>全データリセット（初期化）</h3>
            <p className={`${styles.descriptionText} ${styles.criticalWarningText}`}>
              <AlertTriangle className={`${styles.iconSmall} ${styles.warningIcon}`} />
              全ての学習データ（問題リスト自体も含む）および解答履歴を完全に削除し、アプリケーションを工場出荷時の状態に戻します。この操作は取り消せません。
            </p>
          </div>
          <button onClick={handleResetClick} className={`${styles.button} ${styles.resetButtonMajor}`}>
            <Trash2 className={styles.icon} /> 全データをリセット
          </button>
        </div>
      </section>
    </div>
  );
};

SettingsPage.propTypes = {
  onResetData: PropTypes.func.isRequired,
  onResetAnswerStatusOnly: PropTypes.func.isRequired,
  onDataImport: PropTypes.func.isRequired,
  onDataExport: PropTypes.func.isRequired,
  onCsvDataExport: PropTypes.func.isRequired,
  onCsvDataImport: PropTypes.func.isRequired,
  onAnswerHistoryCsvExport: PropTypes.func.isRequired,
  onQuestionIdOnlyCsvExport: PropTypes.func.isRequired,
  onAnswerHistoryCsvImport: PropTypes.func.isRequired,
  onFullDataCsvExport: PropTypes.func.isRequired,
  onFullDataCsvImport: PropTypes.func.isRequired,
  onAnswerHistoryJsonExport: PropTypes.func.isRequired,
  onAnswerHistoryJsonImport: PropTypes.func.isRequired,
  onQuestionIdOnlyJsonExport: PropTypes.func.isRequired, // ★ 新しいプロパティ
  onQuestionListJsonExport: PropTypes.func.isRequired // ★ 問題リストJSONエクスポート用
};

export default SettingsPage;
