# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 開発コマンド

### インストールとセットアップ
```bash
# 全ての依存関係をインストール（ルート、フロントエンド、バックエンド）
npm run install:all

# 環境変数テンプレートをコピー
cp backend/.env.example backend/.env
```

### 開発環境
```bash
# フロントエンドとバックエンドを同時起動
npm run dev

# 個別起動
npm run dev:frontend  # React開発サーバー (http://localhost:5173)
npm run dev:backend   # Node.jsサーバー (http://localhost:3001)
```

### ビルドとリント
```bash
# 両方のアプリケーションをビルド
npm run build

# 個別ビルド
npm run build:frontend
npm run build:backend

# コードのリント（各ディレクトリで実行）
cd frontend && npm run lint
cd backend && npm run lint
```

### 本番環境
```bash
npm start  # ビルド済みファイルからバックエンドサーバーを起動
```

## アーキテクチャ概要

リアルタイムオンライン自習室アプリケーション：

**フロントエンド**: React 18 + TypeScript + Vite + Zustand（状態管理）
**バックエンド**: Node.js + Express + TypeScript + Socket.io
**データベース**: PostgreSQL（Vercel Postgres用設定）
**デプロイ**: Vercel モノレポ構成

### プロジェクト構造
```
├── frontend/           # Reactアプリケーション
│   ├── src/
│   │   ├── components/ # 再利用可能なUIコンポーネント
│   │   ├── store/      # Zustand状態管理
│   │   ├── services/   # APIとSocketクライアント
│   │   └── types/      # フロントエンド固有の型定義
├── backend/            # Node.js APIサーバー
│   ├── src/
│   │   ├── routes/     # Expressルートハンドラー
│   │   ├── socket/     # Socket.ioイベントハンドラー
│   │   ├── controllers/# ビジネスロジック
│   │   └── services/   # データレイヤーサービス
├── shared/             # 共有TypeScript型定義
│   └── types/
└── vercel.json         # Vercelデプロイ設定
```

## 主要なアーキテクチャ概念

### リアルタイム通信
Socket.ioを使用したリアルタイム機能：
- 自習室でのユーザープレゼンス
- ライブセッション更新
- 部屋の混雑統計

主要なSocketイベントは `shared/types/index.ts` で定義：
- `join-room`, `leave-room` - 部屋管理
- `user-joined`, `user-left` - プレゼンス更新
- `session-updated` - 学習セッション変更

### 状態管理
フロントエンドはZustand（`frontend/src/store/appStore.ts`）を使用：
- 現在のユーザーセッション状態
- 全部屋のアクティブセッション
- ポモドーロタイマー状態
- 場所データ

### コア機能
1. **ユーザー登録**: ニックネームベース（個人情報なし）
2. **学習セッション**: 学習場所、科目、時間を記録
3. **ポモドーロタイマー**: 25分作業 + 5分休憩サイクル
4. **自習室マップ**: キャンパス場所の視覚的表現
5. **フィードバックシステム**: ユーザーの提案とバグ報告
6. **自動ログアウト**: 予定セッション終了と警告

### API構造
`backend/src/routes/` のRESTエンドポイント：
- `/api/sessions` - 学習セッション管理
- `/api/locations` - 利用可能な学習場所
- `/api/feedback` - ユーザーフィードバック送信
- `/api/health` - サーバーヘルスチェック

### セキュリティ機能
- レート制限（15分間に100リクエスト）
- CORS設定
- Helmetセキュリティヘッダー
- Zodによる入力検証
- 個人情報の非保存（ニックネームのみ）

## 環境変数

バックエンドで必要（`backend/.env.example` を参照）：
- `DATABASE_URL` - PostgreSQL接続文字列
- `JWT_SECRET` - JWT署名シークレット
- `FRONTEND_URL` - CORS用フロントエンドURL
- `RATE_LIMIT_*` - レート制限設定

## データベーススキーマ

主要テーブル（`SYSTEM_DESIGN.md` で定義）：
- `users` - 基本ユーザー情報（ニックネームのみ）
- `study_sessions` - アクティブおよび履歴学習セッション
- `locations` - 利用可能な学習場所
- `feedback` - ユーザーフィードバックと提案

## 開発ノート

- 初心者向けに全ファイルに詳細な日本語コメントを記載
- プロジェクト全体でTypeScript strict mode有効
- Socket.ioサーバー設定は `backend/src/socket/socketHandler.ts`
- フロントエンドとバックエンドで共有する型定義は `shared/types/index.ts`
- Vercelデプロイ設定でフロントエンドとAPIルートの両方を処理