// ===== パッケージのインポート =====
// Expressフレームワーク（Webサーバーを作るためのライブラリ）
import express from 'express';
// CORS（Cross-Origin Resource Sharing）- 異なるドメインからのアクセスを許可
import cors from 'cors';
// Helmet - セキュリティヘッダーを自動設定してくれるライブラリ
import helmet from 'helmet';
// Rate Limit - APIへのアクセス回数を制限してサーバーを守る
import rateLimit from 'express-rate-limit';
// HTTPサーバーを作成するためのNodeJS標準ライブラリ
import { createServer } from 'http';
// Socket.io - リアルタイム通信を可能にするライブラリ
import { Server } from 'socket.io';
// 環境変数を.envファイルから読み込むライブラリ
import dotenv from 'dotenv';

// ===== 自作モジュールのインポート =====
// ソケット（リアルタイム通信）の処理を行う関数
import { setupSocket } from './socket/socketHandler.js';
// 学習セッション関連のAPI処理
import sessionRoutes from './routes/sessionRoutes.js';
// 場所関連のAPI処理
import locationRoutes from './routes/locationRoutes.js';
// フィードバック関連のAPI処理
import feedbackRoutes from './routes/feedbackRoutes.js';

// .envファイルから環境変数を読み込む
dotenv.config();

// ===== サーバーの基本設定 =====
// Expressアプリケーションを作成
const app = express();
// HTTPサーバーを作成（ExpressアプリをHTTPサーバーでラップ）
const server = createServer(app);

// ===== Socket.ioサーバーの設定 =====
// Socket.ioサーバーを作成（リアルタイム通信用）
const io = new Server(server, {
  cors: {
    // フロントエンドのURLを許可（環境変数またはデフォルト値）
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    // 許可するHTTPメソッド
    methods: ["GET", "POST"]
  }
});

// ===== レート制限の設定 =====
// APIへのアクセス回数を制限（DDoS攻撃などから守る）
const limiter = rateLimit({
  // 制限時間（ミリ秒）- デフォルト15分
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  // 制限時間内の最大リクエスト数 - デフォルト100回
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
});

// ===== ミドルウェアの設定 =====
// セキュリティヘッダーを自動設定
app.use(helmet());
// CORS設定 - フロントエンドからのアクセスを許可
app.use(cors({
  // 許可するフロントエンドのURL
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  // クッキーなどの認証情報を含むリクエストを許可
  credentials: true
}));
// JSONデータの解析を有効化（最大10MB）
app.use(express.json({ limit: '10mb' }));
// レート制限を適用
app.use(limiter);

// ===== APIルートの設定 =====
// 学習セッション関連のAPI（/api/sessions/...）
app.use('/api/sessions', sessionRoutes);
// 場所関連のAPI（/api/locations/...）
app.use('/api/locations', locationRoutes);
// フィードバック関連のAPI（/api/feedback/...）
app.use('/api/feedback', feedbackRoutes);

// ===== ヘルスチェックAPI =====
// サーバーが正常に動作しているかを確認するためのエンドポイント
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ===== Socket.ioの初期化 =====
// ソケット通信の処理を設定
setupSocket(io);

// ===== サーバー起動 =====
// サーバーのポート番号（環境変数またはデフォルト3001）
const PORT = process.env.PORT || 3001;

// サーバーを指定ポートで起動
server.listen(PORT, () => {
  console.log(`🚀 サーバーがポート ${PORT} で起動しました`);
  console.log(`📡 Socket.io が接続を待機しています`);
});

// アプリケーションをエクスポート（テスト等で使用）
export default app;
