// バックエンドテスト環境のセットアップファイル
// このファイルはすべてのテストファイルが実行される前に一度だけ実行されます

import dotenv from 'dotenv'

// テスト用環境変数の設定
dotenv.config({ path: '.env.test' })

// デフォルト環境変数の設定
process.env.NODE_ENV = 'test'
process.env.PORT = '3001'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.RATE_LIMIT_WINDOW_MS = '900000'
process.env.RATE_LIMIT_MAX_REQUESTS = '100'

// データベースの設定（テスト用）
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'

// Socket.ioのテスト設定
jest.setTimeout(10000) // 10秒でタイムアウト

// グローバルな設定やヘルパー関数があればここに追加