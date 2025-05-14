// src/db.js

// --- 定数定義 ---
const DB_NAME = 'studySchedulerDB'; // データベース名
const DB_VERSION = 1; // データベースのバージョン (スキーマ変更時にインクリメント)
const STORE_SUBJECTS = 'subjects'; // 科目・章・問題データ用ストア
const STORE_HISTORY = 'answerHistory'; // 解答履歴用ストア
const STORE_SETTINGS = 'settings'; // 設定（レイアウト等）用ストア

// --- データベース接続を開く ---
/**
 * IndexedDBデータベースへの接続を開きます。
 * データベースが存在しない場合やバージョンが古い場合は、
 * オブジェクトストアとインデックスを作成・更新します。
 * @returns {Promise<IDBDatabase>} データベース接続のPromise
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    // データベース接続を開くリクエスト
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // スキーマのアップグレードが必要な場合 (初回作成時 or バージョンアップ時)
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log(`IndexedDB: Upgrading to version ${DB_VERSION}`);

      // --- オブジェクトストアの作成 ---
      // 1. 科目データストア (キー: subjectId)
      if (!db.objectStoreNames.contains(STORE_SUBJECTS)) {
        db.createObjectStore(STORE_SUBJECTS, { keyPath: 'subjectId' });
        console.log(`IndexedDB: Object store "${STORE_SUBJECTS}" created.`);
      }

      // 2. 解答履歴ストア (キー: id, 自動生成ではない想定。App.js側でUUID生成を期待)
      //    もし自動生成にするなら { keyPath: 'id', autoIncrement: true } とする
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        const historyStore = db.createObjectStore(STORE_HISTORY, { keyPath: 'id' }); // keyPathを 'id' に設定
        // 検索用にインデックスを作成
        historyStore.createIndex('questionIdIndex', 'questionId', { unique: false });
        historyStore.createIndex('timestampIndex', 'timestamp', { unique: false });
        console.log(`IndexedDB: Object store "${STORE_HISTORY}" created with indexes.`);
      }

      // 3. 設定ストア (キー: settingName)
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'settingName' });
        console.log(`IndexedDB: Object store "${STORE_SETTINGS}" created.`);
      }
      // --- 他に必要なストアがあればここに追加 ---
    };

    // 接続成功時
    request.onsuccess = (event) => {
      console.log("IndexedDB: Database opened successfully.");
      resolve(event.target.result); // DB接続オブジェクトを返す
    };

    // 接続失敗時
    request.onerror = (event) => {
      console.error("IndexedDB: Database error:", event.target.error);
      reject(`IndexedDB error: ${event.target.error}`);
    };
  });
};

// --- データ操作関数 ---

/**
 * 科目データをIndexedDBに保存します（既存データは上書き）。
 * @param {Array} subjectsData 保存する科目データの配列
 * @returns {Promise<void>}
 */
const saveSubjects = async (subjectsData) => {
  if (!Array.isArray(subjectsData)) {
    console.error("saveSubjects: Invalid data provided. Expected an array.");
    return Promise.reject("Invalid data: Expected an array.");
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SUBJECTS], 'readwrite');
    const store = transaction.objectStore(STORE_SUBJECTS);

    const clearRequest = store.clear();
    clearRequest.onsuccess = () => {
      console.log(`IndexedDB: Cleared existing data in "${STORE_SUBJECTS}".`);
      let count = 0;
      const totalSubjects = subjectsData.length;
      if (totalSubjects === 0) {
          // データが空の場合はすぐに完了
          // transaction.oncomplete で resolve される
          return;
      }
      subjectsData.forEach(subject => {
        if (subject.subjectId !== undefined && subject.subjectId !== null) {
            try {
                 const putRequest = store.put(subject);
                 putRequest.onsuccess = () => {
                     count++;
                     // すべてのputが成功したらトランザクション完了を待つ
                     // if (count === totalSubjects) {
                     //   // トランザクション完了ハンドラで resolve する
                     // }
                 };
                 putRequest.onerror = (event) => {
                    console.error(`IndexedDB: Error putting subject ${subject.subjectId}:`, event.target.error);
                    // エラーが発生しても他の処理は続ける場合がある
                    // エラー発生時もカウントを進める（完了判定のため）
                    count++;
                    // if (count === totalSubjects) {
                    //    // トランザクション完了ハンドラで resolve する
                    // }
                 };
            } catch (e) {
                console.error(`IndexedDB: Error preparing put request for subject ${subject.subjectId}:`, e, subject);
                 count++; // エラーでもカウント
                 // if (count === totalSubjects) {
                 //    // トランザクション完了ハンドラで resolve する
                 // }
            }
        } else {
            console.warn("IndexedDB: Skipping subject with missing subjectId:", subject);
             count++; // スキップでもカウント
             // if (count === totalSubjects) {
             //    // トランザクション完了ハンドラで resolve する
             // }
        }
      });
    };
     clearRequest.onerror = (event) => {
       console.error(`IndexedDB: Error clearing store "${STORE_SUBJECTS}":`, event.target.error);
       reject(`Error clearing store: ${event.target.error}`);
     };

    transaction.oncomplete = () => {
      console.log(`IndexedDB: Transaction complete for saveSubjects. Processed ${subjectsData.length} subjects.`);
      resolve();
    };
    transaction.onerror = (event) => {
      console.error("IndexedDB: Transaction error during saveSubjects:", event.target.error);
      reject(`Transaction error: ${event.target.error}`);
    };
  });
};

/**
 * IndexedDBからすべての科目データを読み込みます。
 * @returns {Promise<Array>} 科目データの配列
 */
const loadSubjects = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SUBJECTS], 'readonly');
    const store = transaction.objectStore(STORE_SUBJECTS);
    const request = store.getAll();

    request.onsuccess = (event) => {
      const subjects = event.target.result || [];
      console.log(`IndexedDB: Loaded ${subjects.length} subjects.`);
      // Dateオブジェクトの復元
      subjects.forEach(subject => {
        subject.chapters?.forEach(chapter => {
          chapter.questions?.forEach(q => {
            if (q.lastAnswered && !(q.lastAnswered instanceof Date)) {
              const parsedDate = new Date(q.lastAnswered);
              q.lastAnswered = !isNaN(parsedDate.getTime()) ? parsedDate : null;
            }
             if (q.nextDate && !(q.nextDate instanceof Date)) {
               const parsedDate = new Date(q.nextDate);
               // App.jsがISO文字列を期待している場合
               q.nextDate = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null;
             }
          });
        });
      });
      resolve(subjects);
    };
    request.onerror = (event) => {
      console.error("IndexedDB: Error loading subjects:", event.target.error);
      reject(`Error loading subjects: ${event.target.error}`);
    };
  });
};

/**
 * 解答履歴レコードをIndexedDBに追加します。
 * App.js側でユニークなIDを生成して渡すことを想定。
 * @param {Object} historyRecord 追加する解答履歴オブジェクト (idを含む)
 * @returns {Promise<IDBValidKey>} 追加されたレコードのキー (渡されたidと同じはず)
 */
const addAnswerHistory = async (historyRecord) => {
   // historyRecordにidが含まれているかチェック
   if (!historyRecord || typeof historyRecord.id === 'undefined' || historyRecord.id === null) {
       console.error("addAnswerHistory: historyRecord must have a unique 'id'.");
       return Promise.reject("History record must have a unique 'id'.");
   }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_HISTORY], 'readwrite');
    const store = transaction.objectStore(STORE_HISTORY);
    const request = store.add(historyRecord); // idを含むオブジェクトを追加

    request.onsuccess = (event) => {
      // console.log("IndexedDB: Added answer history record with key:", event.target.result);
      resolve(event.target.result);
    };
    request.onerror = (event) => {
      console.error("IndexedDB: Error adding answer history:", event.target.error);
      reject(`Error adding answer history: ${event.target.error}`);
    };
  });
};

/**
 * IndexedDBからすべての解答履歴を読み込みます。
 * @returns {Promise<Array>} 解答履歴の配列
 */
const loadAnswerHistory = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_HISTORY], 'readonly');
    const store = transaction.objectStore(STORE_HISTORY);
    const request = store.getAll();

    request.onsuccess = (event) => {
      const history = event.target.result || [];
      console.log(`IndexedDB: Loaded ${history.length} answer history records.`);
      resolve(history);
    };
    request.onerror = (event) => {
      console.error("IndexedDB: Error loading answer history:", event.target.error);
      reject(`Error loading answer history: ${event.target.error}`);
    };
  });
};

/**
 * IndexedDBのすべての学習データ（科目、履歴、設定）をクリアします。
 * @returns {Promise<void>}
 */
const clearAllData = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    // 全てのストアを対象にトランザクション開始
    const transaction = db.transaction([STORE_SUBJECTS, STORE_HISTORY, STORE_SETTINGS], 'readwrite');
    const subjectsStore = transaction.objectStore(STORE_SUBJECTS);
    const historyStore = transaction.objectStore(STORE_HISTORY);
    const settingsStore = transaction.objectStore(STORE_SETTINGS);

    const clearSubjectsReq = subjectsStore.clear();
    const clearHistoryReq = historyStore.clear();
    const clearSettingsReq = settingsStore.clear(); // 設定もクリア

    let clearedCount = 0;
    const totalStores = 3;

    const checkCompletion = () => {
        clearedCount++;
        if (clearedCount === totalStores) {
            // トランザクション完了を待つ必要はない、oncompleteでresolveされる
        }
    };

    clearSubjectsReq.onsuccess = checkCompletion;
    clearHistoryReq.onsuccess = checkCompletion;
    clearSettingsReq.onsuccess = checkCompletion;

    transaction.oncomplete = () => {
      console.log("IndexedDB: All study data cleared (subjects, history, settings).");
      resolve();
    };
    transaction.onerror = (event) => {
      console.error("IndexedDB: Error clearing all data:", event.target.error);
      reject(`Error clearing data: ${event.target.error}`);
    };
  });
};

/**
 * 問題の回答状況（履歴と問題内のステータス）のみをリセットします。
 * @returns {Promise<void>}
 */
const clearAnswerStatus = async () => {
  const db = await openDB();
  return new Promise(async (resolve, reject) => {
    // 1. 解答履歴をクリア
    const historyTransaction = db.transaction([STORE_HISTORY], 'readwrite');
    const historyStore = historyTransaction.objectStore(STORE_HISTORY);
    const clearHistoryReq = historyStore.clear();

    clearHistoryReq.onerror = (event) => reject(`Error clearing history: ${event.target.error}`);

    clearHistoryReq.onsuccess = async () => {
      console.log("IndexedDB: Answer history cleared.");

      // 2. 科目データを読み込み、問題ステータスをリセットして保存し直す
      try {
        const subjects = await loadSubjects();
        const resetSubjects = subjects.map(subject => ({
          ...subject,
          chapters: subject.chapters.map(chapter => ({
            ...chapter,
            questions: chapter.questions.map(question => ({
              ...question,
              answerCount: 0,
              correctRate: 0,
              understanding: '理解○',
              lastAnswered: null,
              nextDate: null,
              previousUnderstanding: null,
            }))
          }))
        }));

        await saveSubjects(resetSubjects);
        console.log("IndexedDB: Question statuses reset.");
        resolve();
      } catch (error) {
        console.error("IndexedDB: Error resetting question statuses:", error);
        reject(error);
      }
    };
  });
};

/**
 * 特定の設定値をIndexedDBに保存します。
 * @param {string} settingName 設定名
 * @param {any} value 保存する値
 * @returns {Promise<void>}
 */
const saveSetting = async (settingName, value) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_SETTINGS], 'readwrite');
    const store = transaction.objectStore(STORE_SETTINGS);
    const request = store.put({ settingName: settingName, value: value });

    request.onsuccess = () => { resolve(); };
    request.onerror = (event) => { reject(`Error saving setting: ${event.target.error}`); };
  });
};

/**
 * 特定の設定値をIndexedDBから読み込みます。
 * @param {string} settingName 読み込む設定名
 * @param {any} defaultValue デフォルト値
 * @returns {Promise<any>} 設定値またはデフォルト値
 */
const loadSetting = async (settingName, defaultValue = null) => {
  try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
          const transaction = db.transaction([STORE_SETTINGS], 'readonly');
          const store = transaction.objectStore(STORE_SETTINGS);
          const request = store.get(settingName);

          request.onsuccess = (event) => {
              const result = event.target.result;
              resolve(result ? result.value : defaultValue);
          };
          request.onerror = (event) => {
              console.error(`IndexedDB: Error loading setting "${settingName}":`, event.target.error);
              resolve(defaultValue);
          };
      });
  } catch (error) {
      console.error(`IndexedDB: Failed to open DB for loading setting "${settingName}":`, error);
      return Promise.resolve(defaultValue);
  }
};


// --- ★★★ 修正点: 定数をエクスポートに追加 ★★★ ---
export {
  openDB,
  saveSubjects,
  loadSubjects,
  addAnswerHistory,
  loadAnswerHistory,
  clearAllData,
  clearAnswerStatus,
  saveSetting,
  loadSetting,
  // 定数もエクスポートする
  DB_NAME,
  DB_VERSION,
  STORE_SUBJECTS,
  STORE_HISTORY,
  STORE_SETTINGS,
};
