# オンライン自習室 システム設計書

## 1. アーキテクチャ概要

### 1.1 技術スタック
- **フロントエンド**: React 18 + TypeScript + Vite
- **バックエンド**: Node.js + Express + TypeScript
- **データベース**: PostgreSQL (Vercel Postgres)
- **リアルタイム通信**: Socket.io
- **認証**: JWT + bcrypt
- **デプロイ**: Vercel
- **状態管理**: Zustand または React Context API

### 1.2 システム構成図
```
[フロントエンド (React)]
        ↓ HTTP/WebSocket
[API Gateway (Vercel)]
        ↓
[バックエンド (Node.js/Express)]
        ↓
[データベース (PostgreSQL)]
```

## 2. プロジェクト構造

```
online-study-room/
├── frontend/                 # Reactアプリケーション
│   ├── src/
│   │   ├── components/       # 再利用可能なコンポーネント
│   │   ├── pages/           # ページコンポーネント
│   │   ├── hooks/           # カスタムフック
│   │   ├── services/        # API通信
│   │   ├── types/           # TypeScript型定義
│   │   ├── utils/           # ユーティリティ関数
│   │   └── store/           # 状態管理
│   ├── public/
│   └── package.json
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── controllers/     # コントローラー
│   │   ├── models/          # データモデル
│   │   ├── routes/          # ルーティング
│   │   ├── middleware/      # ミドルウェア
│   │   ├── services/        # ビジネスロジック
│   │   ├── socket/          # Socket.io設定
│   │   └── utils/           # ユーティリティ
│   └── package.json
├── shared/                   # 共通型定義
│   └── types/
└── vercel.json              # Vercel設定
```

## 3. データベース設計

### 3.1 テーブル構造

#### users テーブル
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  nickname VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### study_sessions テーブル
```sql
CREATE TABLE study_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  nickname VARCHAR(50) NOT NULL,
  location VARCHAR(100),
  subject VARCHAR(100),
  scheduled_end_time TIMESTAMP NOT NULL,
  actual_end_time TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  show_duration BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### locations テーブル
```sql
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### feedback テーブル
```sql
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  user_ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4. API設計

### 4.1 RESTful API エンドポイント

#### ユーザー関連
- `POST /api/users` - ユーザー登録
- `PUT /api/users/:id` - ユーザー情報更新

#### 学習セッション関連
- `POST /api/sessions` - 学習セッション開始
- `PUT /api/sessions/:id` - セッション情報更新
- `DELETE /api/sessions/:id` - セッション終了
- `GET /api/sessions/active` - アクティブセッション一覧取得

#### 場所関連
- `GET /api/locations` - 利用可能な場所一覧取得

#### フィードバック関連
- `POST /api/feedback` - フィードバック送信

### 4.2 WebSocket イベント

#### クライアント → サーバー
- `join-room` - 学習室参加
- `leave-room` - 学習室退出
- `update-session` - セッション情報更新

#### サーバー → クライアント
- `user-joined` - ユーザー参加通知
- `user-left` - ユーザー退出通知
- `session-updated` - セッション更新通知
- `room-stats` - 各場所の人数統計

## 5. フロントエンド設計

### 5.1 主要コンポーネント

```
App
├── Header
│   ├── Clock
│   └── UserInfo
├── PomodoroTimer
├── StudyRoomMap
│   ├── LocationCard
│   └── UserAvatar
├── UserRegistration
├── FeedbackForm
└── NotificationHandler
```

### 5.2 状態管理

```typescript
// Zustand Store例
interface AppState {
  user: User | null;
  activeSession: StudySession | null;
  locations: Location[];
  activeSessions: StudySession[];
  pomodoroState: PomodoroState;
  
  // Actions
  setUser: (user: User) => void;
  startSession: (session: StudySession) => void;
  endSession: () => void;
  updateLocations: (locations: Location[]) => void;
}
```

### 5.3 主要機能の実装

#### ポモドーロタイマー
```typescript
const usePomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isBreak, setIsBreak] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  // タイマーロジック
  // 通知機能
  // 自動ループ機能
};
```

#### リアルタイム通信
```typescript
const useSocket = () => {
  const socket = io(process.env.REACT_APP_API_URL);
  
  useEffect(() => {
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('session-updated', handleSessionUpdated);
    
    return () => socket.disconnect();
  }, []);
};
```

## 6. バックエンド設計

### 6.1 主要サービス

```typescript
// SessionService
class SessionService {
  async createSession(sessionData: CreateSessionDTO): Promise<StudySession>
  async updateSession(id: number, updates: UpdateSessionDTO): Promise<StudySession>
  async endSession(id: number): Promise<void>
  async getActiveSessions(): Promise<StudySession[]>
  async scheduleAutoExit(sessionId: number, endTime: Date): Promise<void>
}

// NotificationService
class NotificationService {
  async scheduleExitWarning(sessionId: number, warningTime: Date): Promise<void>
  async sendExitReminder(sessionId: number): Promise<void>
}
```

### 6.2 Socket.io設定

```typescript
io.on('connection', (socket) => {
  socket.on('join-room', async (data) => {
    const { userId, location } = data;
    socket.join(location);
    
    // アクティブユーザー情報を全体に配信
    io.emit('user-joined', userData);
  });
  
  socket.on('disconnect', () => {
    // ユーザー退出処理
    io.emit('user-left', userId);
  });
});
```

## 7. Vercelデプロイ設定

### 7.1 vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "backend/src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/src/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 7.2 環境変数
```
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key

# CORS
FRONTEND_URL=https://your-domain.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 8. セキュリティ考慮事項

### 8.1 データ保護
- ニックネームのみ保存（個人情報収集を最小限に）
- IPアドレスはハッシュ化して保存
- セッション情報は24時間後に自動削除

### 8.2 レート制限
- フィードバック送信: 1日1回まで
- セッション作成: 1時間に5回まで
- API全般: 15分間に100リクエストまで

### 8.3 入力検証
- ニックネーム: 50文字以内、本名使用の警告
- 学習時間: 最大12時間
- フィードバック: 1000文字以内

## 9. パフォーマンス最適化

### 9.1 フロントエンド
- React.memoを活用したコンポーネント最適化
- 仮想化（react-window）で大量データ表示最適化
- Service Workerでオフライン対応

### 9.2 バックエンド
- データベースインデックス最適化
- Redis（Vercel KV）でセッション情報キャッシュ
- Connection poolingでDB接続効率化

## 10. 監視・ログ

### 10.1 メトリクス監視
- アクティブユーザー数
- セッション継続時間
- API レスポンス時間
- エラー発生率

### 10.2 ログ管理
- API アクセスログ
- エラーログ（Vercel Analytics）
- ユーザー行動ログ（匿名化）

## 11. 開発・デプロイフロー

### 11.1 開発環境
```bash
# 開発サーバー起動
npm run dev:frontend  # React開発サーバー
npm run dev:backend   # Node.js開発サーバー
npm run dev:db        # ローカルPostgreSQL
```

### 11.2 CI/CDパイプライン
1. GitHub Actionsでテスト実行
2. TypeScriptコンパイルチェック
3. ESLint/Prettier実行
4. Vercelへ自動デプロイ

この設計書に基づいて、段階的に実装を進めることをお勧めします。まずは基本的なユーザー登録・セッション管理から始め、リアルタイム機能、ポモドーロタイマーの順で開発していくのが効率的です。