// ===== インポート =====
// Expressのルーター機能
import { Router } from 'express';
// バリデーション（入力値検証）ライブラリ
import { z } from 'zod';
// レート制限ライブラリ（アクセス回数制限）
import rateLimit from 'express-rate-limit';
// フィードバック情報のデータ型定義
import type { CreateFeedbackDTO } from '@shared/types/index.js';

// ===== ルーターの初期化 =====
// フィードバック関連のAPIエンドポイントを管理するルーター
const router = Router();

// ===== バリデーションスキーマ =====
// フィードバック送信時の入力値検証ルール
const feedbackSchema = z.object({
  // フィードバックのカテゴリ: 場所、バグ、機能要望、その他
  category: z.enum(['location', 'bug', 'feature', 'other']),
  // フィードバック内容: 1-1000文字
  content: z.string().min(1).max(1000)
});

// ===== フィードバック用レート制限 =====
// スパム防止のため、1日に1回までの制限を設定
const feedbackLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,  // 24時間をミリ秒で表現
  max: 1,                          // 上記時間内の最大リクエスト数
  message: { error: 'フィードバックは1日1回まで送信可能です。' },
  // ユーザーを識別するためのIPアドレスを取得
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  }
});

// ===== データストレージ =====
// 受信したフィードバックを保存するメモリ内配列
const feedbacks: any[] = [];

// ===== フィードバック送信API =====
// POST /api/feedback - ユーザーからのフィードバックを受信
// feedbackLimiter: 1日1回の制限を適用
router.post('/', feedbackLimiter, async (req, res) => {
  try {
    // リクエストボディの入力値を検証
    const validatedData = feedbackSchema.parse(req.body) as CreateFeedbackDTO;
    
    // 新しいフィードバックオブジェクトを作成
    const feedback = {
      id: feedbacks.length + 1,            // 一意のID（簡単な連番）
      ...validatedData,                     // 入力されたデータを展開
      userIp: req.ip,                       // 送信者のIPアドレスを記録
      createdAt: new Date().toISOString()   // 送信日時
    };

    // フィードバックを配列に保存
    feedbacks.push(feedback);

    // サーバーログにフィードバックの概要を記録
    console.log(`新しいフィードバック: ${feedback.category} - ${feedback.content.substring(0, 50)}...`);

    // 成功レスポンスを返す
    res.status(201).json({ 
      message: 'フィードバックをありがとうございます！ご意見を参考にサービス改善に努めます。',
      feedbackId: feedback.id
    });
  } catch (error) {
    // バリデーションエラーの場合
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    // その他のエラー
    console.error('フィードバック作成エラー:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ルーターをエクスポート（メインアプリケーションで使用）
export default router;