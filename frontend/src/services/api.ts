// ===== インポート =====
// HTTPリクエストライブラリ（サーバーとのデータ通信用）
import axios from 'axios';
// 共通で使用するデータ型の定義
import type { StudySession, Location, CreateSessionDTO, UpdateSessionDTO, CreateFeedbackDTO } from '@shared/types';

// ===== APIベースURLの設定 =====
// 環境変数からAPIサーバーのURLを取得（なければローカルホストを使用）
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ===== APIクライアントの作成 =====
// 共通設定を持つHTTPクライアントを作成
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,        // すべてのAPIリクエストのベースURL
  timeout: 10000,                       // リクエストタイムアウト: 10秒
  headers: {
    'Content-Type': 'application/json', // JSONデータを送信することを明示
  },
});

// ===== レスポンスインターセプター =====
// すべてのAPIレスポンスを自動的に処理する仕組み
apiClient.interceptors.response.use(
  (response) => response,  // 成功時はそのまま返す
  (error) => {
    // エラー時はコンソールにログ出力してからエラーを再び投げる
    console.error('API エラー:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ===== API関数のエクスポート =====
// アプリケーションから使用できるAPI関数をまとめたオブジェクト
export const api = {
  // ===== 学習セッション関連API =====
  // 新しい学習セッションを作成
  createSession: async (data: CreateSessionDTO): Promise<StudySession> => {
    const response = await apiClient.post('/sessions', data);
    return response.data;
  },

  // 現在アクティブな学習セッション一覧を取得
  getActiveSessions: async (): Promise<StudySession[]> => {
    const response = await apiClient.get('/sessions/active');
    return response.data;
  },

  // 既存の学習セッションを更新（場所変更など）
  updateSession: async (id: number, data: UpdateSessionDTO): Promise<StudySession> => {
    const response = await apiClient.put(`/sessions/${id}`, data);
    return response.data;
  },

  // 学習セッションを終了
  endSession: async (id: number): Promise<void> => {
    await apiClient.delete(`/sessions/${id}`);
  },

  // ===== 学習場所関連API =====
  // 利用可能な学習場所一覧を取得
  getLocations: async (): Promise<Location[]> => {
    const response = await apiClient.get('/locations');
    return response.data;
  },

  // ===== フィードバック関連API =====
  // ユーザーからのフィードバックを送信
  submitFeedback: async (data: CreateFeedbackDTO): Promise<void> => {
    await apiClient.post('/feedback', data);
  },

  // ===== システム関連API =====
  // サーバーの状態を確認（接続テスト)
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};