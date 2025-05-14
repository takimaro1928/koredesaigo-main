import 'react-day-picker/dist/style.css'; // 既存のimport
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; // ← コメント解除

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWAとしてアプリを登録する
// ↓↓↓ コメントアウトを解除 ↓↓↓
serviceWorkerRegistration.register({
  onUpdate: registration => {
    const waitingServiceWorker = registration.waiting;
    if (waitingServiceWorker) {
      waitingServiceWorker.addEventListener("statechange", event => {
        if (event.target.state === "activated") {
          // 新しいバージョンが利用可能になったことをユーザーに通知し、リロードを促す
          if (window.confirm('新しいバージョンが利用可能です。更新しますか？')) {
            window.location.reload();
          }
        }
      });
      // 新しいService Workerにすぐにアクティブになるように指示
      waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
    }
  },
  onSuccess: registration => {
    console.log('Service Worker registered successfully:', registration);
    // 初回キャッシュ完了時などの処理をここに追加できる
  }
});
// ↑↑↑ コメントアウトを解除 ↑↑↑

