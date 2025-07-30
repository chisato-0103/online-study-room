// ===== インポート =====
// Expressのルーター機能
import { Router } from 'express';
// 場所情報のデータ型定義
import type { Location } from '@shared/types/index.js';

// ===== ルーターの初期化 =====
// 学習場所関連のAPIエンドポイントを管理するルーター
const router = Router();

// ===== デフォルト学習場所データ =====
// アプリケーションで使用できる学習場所の一覧
const defaultLocations: Location[] = [
  {
    id: 1,
    name: 'library',                    // 内部的な識別子
    displayName: '図書館',               // ユーザーに表示される名前
    isActive: true,                     // アクティブ状態（使用可能）
    createdAt: new Date().toISOString() // 作成日時
  },
  {
    id: 2,
    name: 'building1_1f',
    displayName: '1号館1F',              // 1号館の1階
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: 'building1_2f',
    displayName: '1号館2F',              // 1号館の2階
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    name: 'other',
    displayName: 'その他自習室',          // 上記以外の場所
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// ===== 学習場所一覧取得API =====
// GET /api/locations - 使用可能な学習場所の一覧を取得
router.get('/', async (req, res) => {
  try {
    // アクティブな場所のみをフィルタリングして返す
    const activeLocations = defaultLocations.filter(location => location.isActive);
    res.json(activeLocations);
  } catch (error) {
    console.error('学習場所取得エラー:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ルーターをエクスポート（メインアプリケーションで使用）
export default router;