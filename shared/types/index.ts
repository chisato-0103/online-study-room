// ===== ユーザー情報の型定義 =====
// アプリケーションを使用するユーザーの基本情報
export interface User {
  id: number;           // ユーザーの一意識別子
  nickname: string;     // ユーザーのニックネーム
  createdAt: string;    // アカウント作成日時
  updatedAt: string;    // 最終更新日時
}

// ===== 学習セッション情報の型定義 =====
// ユーザーの学習セッション（勉強の記録）に関する全ての情報
export interface StudySession {
  id: number;                    // セッションの一意識別子
  userId?: number;               // セッション作成者のユーザーID（オプション）
  nickname: string;              // 表示用ニックネーム
  location?: string;             // 学習場所（図書館、1号館1Fなど）
  subject?: string;              // 学習科目（数学、英語など）
  scheduledEndTime: string;      // 予定終了時間
  actualEndTime?: string;        // 実際の終了時間（オプション）
  isActive: boolean;             // セッションがアクティブ（進行中）かどうか
  showDuration: boolean;         // 経過時間を他のユーザーに表示するかどうか
  createdAt: string;             // セッション作成日時
  updatedAt: string;             // セッション最終更新日時
}

// ===== 学習場所情報の型定義 =====
// アプリで選択できる学習場所の情報
export interface Location {
  id: number;              // 場所の一意識別子
  name: string;            // 内部的な場所名（システム用）
  displayName: string;     // ユーザーに表示される場所名
  isActive: boolean;       // その場所が現在利用可能かどうか
  createdAt: string;       // 場所データ作成日時
}

// ===== フィードバック情報の型定義 =====
// ユーザーからのフィードバック（意見・要望・バグ報告など）
export interface Feedback {
  id: number;                                          // フィードバックの一意識別子
  category: 'location' | 'bug' | 'feature' | 'other'; // カテゴリ（場所・バグ・機能要望・その他）
  content: string;                                     // フィードバック内容
  userIp?: string;                                     // 送信者のIPアドレス（オプション）
  createdAt: string;                                   // フィードバック送信日時
}

// ===== ポモドーロタイマーの状態型定義 =====
// ポモドーロテクニック（25分勉強+5分休憩）のタイマー状態
export interface PomodoroState {
  timeLeft: number;      // 残り時間（秒）
  isBreak: boolean;      // 現在が休憩時間かどうか
  isActive: boolean;     // タイマーが動作中かどうか
  session: number;       // 現在のセッション番号（何回目の勉強時間か）
}

// ===== セッション作成用データ型定義 =====
// 新しい学習セッションを作成するときに必要な情報
export interface CreateSessionDTO {
  nickname: string;              // ユーザーのニックネーム（必須）
  location?: string;             // 学習場所（オプション）
  subject?: string;              // 学習科目（オプション）
  scheduledEndTime: string;      // 予定終了時間（必須）
  showDuration?: boolean;        // 経過時間表示設定（オプション、デフォルトtrue）
}

// ===== セッション更新用データ型定義 =====
// 既存の学習セッションを更新するときに変更可能な情報
export interface UpdateSessionDTO {
  location?: string;             // 学習場所の変更（オプション）
  subject?: string;              // 学習科目の変更（オプション）
  scheduledEndTime?: string;     // 予定終了時間の変更（オプション）
  showDuration?: boolean;        // 経過時間表示設定の変更（オプション）
}

// ===== フィードバック送信用データ型定義 =====
// ユーザーがフィードバックを送信するときに必要な情報
export interface CreateFeedbackDTO {
  category: 'location' | 'bug' | 'feature' | 'other';  // フィードバックのカテゴリ（必須）
  content: string;                                      // フィードバック内容（必須）
}

// ===== WebSocketイベント型定義 =====
// リアルタイム通信で使用されるイベントとそのデータ構造
export interface SocketEvents {
  // ユーザーがルームに参加するときのイベント
  'join-room': (data: { userId?: number; location: string }) => void;
  // ユーザーがルームから退室するときのイベント
  'leave-room': (data: { userId?: number }) => void;
  // ユーザーがセッション情報を更新するときのイベント
  'update-session': (data: { sessionId: number; updates: UpdateSessionDTO }) => void;
  // 新しいユーザーが参加したことを他のユーザーに通知するイベント
  'user-joined': (data: StudySession) => void;
  // ユーザーが退室したことを他のユーザーに通知するイベント
  'user-left': (data: { sessionId: number }) => void;
  // セッション情報が更新されたことを他のユーザーに通知するイベント
  'session-updated': (data: StudySession) => void;
  // 各場所の利用者数統計を全ユーザーに通知するイベント
  'room-stats': (data: { location: string; count: number }[]) => void;
}