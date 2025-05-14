/* eslint-disable no-restricted-globals */

// このファイルはCreate React Appによって生成されたService Workerをベースにしています。
// Workboxライブラリを使用して、リソースのプリキャッシュとランタイムキャッシュを管理します。

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

workbox.setConfig({
  debug: false, // 本番環境ではfalseに設定
});

// クライアント（ウェブページ）からのメッセージをリッスン
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Skipping waiting...');
    self.skipWaiting();
  }
});

// プリキャッシュ: アプリケーションシェル（ビルド時に生成されるファイル）をキャッシュします。
// '__WB_MANIFEST' はビルドプロセス中に workbox-webpack-plugin によって置換されます。
// これには index.html, CSS, JavaScript バンドルなどが含まれます。
try {
    workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
} catch (error) {
    console.error("Service Worker: Error during precaching:", error);
}


// ナビゲーションリクエストのルーティング (シングルページアプリケーション用)
// HTMLファイルへのリクエストは、キャッシュされたindex.htmlを返すようにします。
workbox.routing.registerRoute(
  // ナビゲーションリクエスト（ページ遷移）かどうかを判断
  ({ request }) => request.mode === 'navigate',
  // Cache First戦略を使用し、キャッシュがなければネットワークから取得
  new workbox.strategies.CacheFirst({
    cacheName: 'navigation-cache',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200], // オフライン時(0)と成功時(200)をキャッシュ
      }),
    ],
  })
);

// 静的アセット（CSS, JS, Web Workers）のキャッシュ戦略 (Cache First)
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'style' ||
                   request.destination === 'script' ||
                   request.destination === 'worker',
  new workbox.strategies.CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50, // キャッシュする最大エントリ数
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30日間キャッシュ
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// 画像のキャッシュ戦略 (Cache First, より短い有効期限)
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7日間キャッシュ
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// フォントのキャッシュ戦略 (Cache First)
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'font',
  new workbox.strategies.CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1年間キャッシュ
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// その他のオリジンからのリクエスト（例: Google Fonts）のキャッシュ戦略 (Stale While Revalidate)
// workbox.routing.registerRoute(
//   ({ url }) => url.origin === 'https://fonts.googleapis.com' ||
//                url.origin === 'https://fonts.gstatic.com',
//   new workbox.strategies.StaleWhileRevalidate({
//     cacheName: 'google-fonts',
//     plugins: [
//       new workbox.expiration.ExpirationPlugin({ maxEntries: 20 }),
//     ],
//   })
// );

// --- オフライン時のデータアクセスについて ---
// IndexedDBへのアクセスは、アプリケーションコード (App.js や db.js) 内で行われます。
// Service Worker は主にネットワークリクエストをインターセプトし、キャッシュを提供します。
// IndexedDBのデータ自体は Service Worker が直接キャッシュするわけではありませんが、
// アプリケーションシェルがキャッシュされることで、オフラインでも db.js や App.js が
// 実行され、IndexedDBにアクセスできるようになります。

console.log('Service Worker: Loaded and configured.');

