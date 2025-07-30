// ===== インポート =====
// Expressのルーター機能
import { Router } from 'express';
// バリデーション（入力値検証）ライブラリ
import { z } from 'zod';
// 共通で使用するデータ型の定義
import type { CreateSessionDTO, UpdateSessionDTO } from '@shared/types/index.js';

// ===== ルーターの初期化 =====
// セッション関連のAPIエンドポイントを管理するルーター
const router = Router();

// ===== バリデーションスキーマ =====
// 新しいセッション作成時の入力値検証ルール
const createSessionSchema = z.object({
  nickname: z.string().min(1).max(50),        // ニックネーム: 1-50文字
  location: z.string().max(100).optional(),   // 学習場所: 最大100文字（オプション）
  subject: z.string().max(100).optional(),    // 学習科目: 最大100文字（オプション）
  scheduledEndTime: z.string(),               // 予定終了時間: 必須
  showDuration: z.boolean().optional().default(true)  // 経過時間表示: デフォルトtrue
});

// セッション更新時の入力値検証ルール
const updateSessionSchema = z.object({
  location: z.string().max(100).optional(),      // 学習場所: 最大100文字（オプション）
  subject: z.string().max(100).optional(),       // 学習科目: 最大100文字（オプション）
  scheduledEndTime: z.string().optional(),       // 予定終了時間（オプション）
  showDuration: z.boolean().optional()           // 経過時間表示（オプション）
});

// ===== データストレージ =====
// アクティブなセッションを保存するメモリ内ストレージ（セッションID -> セッション情報）
const sessions = new Map<number, any>();
// セッションIDの採番カウンター
let sessionIdCounter = 1;

// ===== セッション作成API =====
// POST /api/sessions - 新しい学習セッションを作成
router.post('/', async (req, res) => {
  try {
    // リクエストボディの入力値を検証
    const validatedData = createSessionSchema.parse(req.body) as CreateSessionDTO;
    
    // ニックネームのセキュリティチェック（本名使用禁止）
    if (validatedData.nickname.toLowerCase().includes('本名') || 
        validatedData.nickname.match(/[一-龯]/g)?.length > 10) {
      return res.status(400).json({ 
        error: '本名の使用は禁止されています。ニックネームを使用してください。' 
      });
    }

    // 時間の妥当性チェック
    const scheduledEnd = new Date(validatedData.scheduledEndTime);
    const now = new Date();
    const maxStudyTime = 12 * 60 * 60 * 1000;  // 12時間をミリ秒で表現
    
    // 学習時間が12時間を超える場合はエラー
    if (scheduledEnd.getTime() - now.getTime() > maxStudyTime) {
      return res.status(400).json({ 
        error: '学習時間は最大12時間までです。' 
      });
    }

    // 新しいセッションオブジェクトを作成
    const session = {
      id: sessionIdCounter++,                    // 一意のID
      ...validatedData,                          // 入力されたデータを展開
      isActive: true,                            // アクティブ状態
      createdAt: new Date().toISOString(),       // 作成日時
      updatedAt: new Date().toISOString()        // 更新日時
    };

    // セッションをメモリに保存
    sessions.set(session.id, session);

    // 予定終了時間になったら自動的にセッションを終了するタイマーを設定
    setTimeout(() => {
      const existingSession = sessions.get(session.id);
      if (existingSession && existingSession.isActive) {
        console.log(`セッション${session.id}（${session.nickname}）を自動終了しました`);
        sessions.delete(session.id);
      }
    }, scheduledEnd.getTime() - now.getTime());

    // 作成されたセッション情報をレスポンスで返す
    res.status(201).json(session);
  } catch (error) {
    // バリデーションエラーの場合
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    // その他のエラー
    console.error('セッション作成エラー:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== アクティブセッション取得API =====
// GET /api/sessions/active - 現在アクティブな学習セッション一覧を取得
router.get('/active', async (req, res) => {
  try {
    // 全セッションからアクティブなもののみを抽出
    const activeSessions = Array.from(sessions.values()).filter(session => session.isActive);
    res.json(activeSessions);
  } catch (error) {
    console.error('アクティブセッション取得エラー:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== セッション更新API =====
// PUT /api/sessions/:id - 既存の学習セッションを更新
router.put('/:id', async (req, res) => {
  try {
    // URLパラメータからセッションIDを取得
    const sessionId = parseInt(req.params.id);
    // リクエストボディの入力値を検証
    const validatedData = updateSessionSchema.parse(req.body) as UpdateSessionDTO;
    
    // 指定されたIDのセッションを取得
    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 既存のセッション情報を更新データでマージ
    const updatedSession = {
      ...session,                            // 既存データ
      ...validatedData,                      // 更新データ
      updatedAt: new Date().toISOString()    // 更新日時を現在時刻に設定
    };

    // 更新されたセッションを保存
    sessions.set(sessionId, updatedSession);
    res.json(updatedSession);
  } catch (error) {
    // バリデーションエラーの場合
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    // その他のエラー
    console.error('セッション更新エラー:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== セッション終了API =====
// DELETE /api/sessions/:id - 学習セッションを終了
router.delete('/:id', async (req, res) => {
  try {
    // URLパラメータからセッションIDを取得
    const sessionId = parseInt(req.params.id);
    const session = sessions.get(sessionId);
    
    // セッションが存在しない場合はエラー
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // セッションを非アクティブに設定し、実際の終了時間を記録
    session.isActive = false;
    session.actualEndTime = new Date().toISOString();
    sessions.set(sessionId, session);

    // 24時間後にセッションデータを完全に削除するタイマーを設定
    // （ログ保持のため即座に削除しない）
    setTimeout(() => {
      sessions.delete(sessionId);
    }, 24 * 60 * 60 * 1000);  // 24時間をミリ秒で表現

    res.json({ message: 'Session ended successfully', session });
  } catch (error) {
    console.error('セッション終了エラー:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ルーターをエクスポート（メインアプリケーションで使用）
export default router;