// Zustandという状態管理ライブラリをインポート（アプリ全体のデータを管理）
import { create } from 'zustand';

// 型定義をインポート（データの構造を定義したもの）
import type { StudySession, Location, PomodoroState } from '@shared/types';

// APIとの通信機能をインポート
import { api } from '../services/api';

// WebSocket通信（リアルタイム通信）機能をインポート
import { socket } from '../services/socket';

/**
 * アプリ全体の状態（データ）の型定義
 * TypeScriptでは、データの構造を事前に定義します
 */
interface AppState {
  // === データ（状態）の定義 ===
  currentSession: StudySession | null;              // 現在のユーザーセッション（ログイン情報）
  locations: Location[];                             // 利用可能な学習場所のリスト
  activeSessions: StudySession[];                    // 現在アクティブな全ユーザーセッション
  locationStats: { location: string; count: number }[]; // 各場所の利用者数統計
  pomodoroState: PomodoroState;                      // ポモドーロタイマーの状態
  isLoading: boolean;                                // 読み込み中かどうか
  error: string | null;                              // エラーメッセージ

  // === アクション（関数）の定義 ===
  // これらの関数を呼び出すことで、上記のデータを変更できます
  initializeApp: () => Promise<void>;               // アプリの初期化
  createSession: (sessionData: any) => Promise<void>; // 新しいセッション作成
  endSession: () => Promise<void>;                   // セッション終了
  updateSession: (updates: any) => Promise<void>;   // セッション情報更新
  setPomodoroState: (state: Partial<PomodoroState>) => void; // ポモドーロ状態更新
  setError: (error: string | null) => void;         // エラー設定
  clearError: () => void;                            // エラークリア
}

export const useAppStore = create<AppState>((set, get) => ({
  currentSession: null,
  locations: [],
  activeSessions: [],
  locationStats: [],
  pomodoroState: {
    timeLeft: 25 * 60,
    isBreak: false,
    isActive: false,
    session: 1
  },
  isLoading: false,
  error: null,

  // ===== アプリ初期化関数 =====
  // アプリ起動時に必要なデータを取得し、WebSocketイベントを設定
  initializeApp: async () => {
    set({ isLoading: true }); // 読み込み中状態に設定
    try {
      // サーバーから必要な初期データを取得
      const locations = await api.getLocations();        // 学習場所一覧
      const activeSessions = await api.getActiveSessions(); // アクティブセッション一覧
      
      // 取得したデータを状態に保存
      set({ 
        locations, 
        activeSessions, 
        isLoading: false  // 読み込み完了
      });

      // ===== WebSocketイベントリスナーの設定 =====
      // 新しいユーザーが参加したときの処理
      socket.on('user-joined', (session: StudySession) => {
        set(state => ({
          activeSessions: [...state.activeSessions, session]  // 新ユーザーをリストに追加
        }));
      });

      // ユーザーが退室したときの処理
      socket.on('user-left', (data: { sessionId: number }) => {
        set(state => ({
          activeSessions: state.activeSessions.filter(s => s.id !== data.sessionId) // 該当ユーザーをリストから削除
        }));
      });

      // ユーザーのセッション情報が更新されたときの処理
      socket.on('session-updated', (updatedSession: StudySession) => {
        set(state => ({
          activeSessions: state.activeSessions.map(s => 
            s.id === updatedSession.id ? updatedSession : s  // 該当ユーザーの情報を更新
          )
        }));
      });

      // 各場所の人数統計が更新されたときの処理
      socket.on('room-stats', (stats: { location: string; count: number }[]) => {
        set({ locationStats: stats }); // 統計情報を更新
      });

    } catch (error) {
      // 初期化失敗時のエラー処理
      set({ 
        error: 'アプリの初期化に失敗しました', 
        isLoading: false 
      });
    }
  },

  // ===== セッション作成関数 =====
  // 新しい学習セッションを作成しDream Roomに参加
  createSession: async (sessionData) => {
    set({ isLoading: true, error: null }); // 読み込み開始、エラークリア
    try {
      // サーバーに新しいセッションを作成依頼
      const session = await api.createSession(sessionData);
      set({ 
        currentSession: session,  // 作成されたセッションを現在のセッションに設定
        isLoading: false 
      });

      // WebSocketでルームに参加することを通知
      socket.emit('join-room', { 
        sessionId: session.id, 
        session 
      });

    } catch (error: any) {
      // セッション作成失敗時のエラー処理
      set({ 
        error: error.response?.data?.error || 'セッションの作成に失敗しました', 
        isLoading: false 
      });
      throw error; // エラーを呼び出し元に伝播
    }
  },

  // ===== セッション終了関数 =====
  // 現在の学習セッションを終了しルームから退室
  endSession: async () => {
    const { currentSession } = get(); // 現在のセッション情報を取得
    if (!currentSession) return;       // セッションがない場合は何もしない

    set({ isLoading: true });
    try {
      // サーバーにセッション終了を通知
      await api.endSession(currentSession.id);
      // WebSocketでルームからの退室を通知
      socket.emit('leave-room');
      // WebSocket接続を切断
      socket.disconnect();
      
      set({ 
        currentSession: null,  // 現在のセッションをクリア
        isLoading: false 
      });
    } catch (error) {
      // セッション終了失敗時のエラー処理
      set({ 
        error: 'セッションの終了に失敗しました', 
        isLoading: false 
      });
    }
  },

  // ===== セッション更新関数 =====
  // 現在のセッション情報を更新（場所変更、科目変更など）
  updateSession: async (updates) => {
    const { currentSession } = get(); // 現在のセッション情報を取得
    if (!currentSession) return;       // セッションがない場合は何もしない

    try {
      // サーバーにセッション更新を依頼
      const updatedSession = await api.updateSession(currentSession.id, updates);
      set({ currentSession: updatedSession }); // ローカル状態も更新

      // WebSocketで他のユーザーに更新を通知
      socket.emit('update-session', {
        sessionId: currentSession.id,
        updates
      });
    } catch (error) {
      // セッション更新失敗時のエラー処理
      set({ error: 'セッションの更新に失敗しました' });
    }
  },

  // ===== ポモドーロ状態更新関数 =====
  // ポモドーロタイマーの状態を部分的に更新
  setPomodoroState: (newState) => {
    set(state => ({
      pomodoroState: { ...state.pomodoroState, ...newState } // 既存状態と新しい状態をマージ
    }));
  },

  // ===== エラー管理関数 =====
  // エラーメッセージを設定
  setError: (error) => {
    set({ error });
  },

  // エラーメッセージをクリア
  clearError: () => {
    set({ error: null });
  }
}));