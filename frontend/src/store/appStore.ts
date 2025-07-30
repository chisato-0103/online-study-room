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

  initializeApp: async () => {
    set({ isLoading: true });
    try {
      const locations = await api.getLocations();
      const activeSessions = await api.getActiveSessions();
      
      set({ 
        locations, 
        activeSessions, 
        isLoading: false 
      });

      socket.on('user-joined', (session: StudySession) => {
        set(state => ({
          activeSessions: [...state.activeSessions, session]
        }));
      });

      socket.on('user-left', (data: { sessionId: number }) => {
        set(state => ({
          activeSessions: state.activeSessions.filter(s => s.id !== data.sessionId)
        }));
      });

      socket.on('session-updated', (updatedSession: StudySession) => {
        set(state => ({
          activeSessions: state.activeSessions.map(s => 
            s.id === updatedSession.id ? updatedSession : s
          )
        }));
      });

      socket.on('room-stats', (stats: { location: string; count: number }[]) => {
        set({ locationStats: stats });
      });

    } catch (error) {
      set({ 
        error: 'アプリの初期化に失敗しました', 
        isLoading: false 
      });
    }
  },

  createSession: async (sessionData) => {
    set({ isLoading: true, error: null });
    try {
      const session = await api.createSession(sessionData);
      set({ 
        currentSession: session, 
        isLoading: false 
      });

      socket.emit('join-room', { 
        sessionId: session.id, 
        session 
      });

    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'セッションの作成に失敗しました', 
        isLoading: false 
      });
      throw error;
    }
  },

  endSession: async () => {
    const { currentSession } = get();
    if (!currentSession) return;

    set({ isLoading: true });
    try {
      await api.endSession(currentSession.id);
      socket.emit('leave-room');
      socket.disconnect();
      
      set({ 
        currentSession: null, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: 'セッションの終了に失敗しました', 
        isLoading: false 
      });
    }
  },

  updateSession: async (updates) => {
    const { currentSession } = get();
    if (!currentSession) return;

    try {
      const updatedSession = await api.updateSession(currentSession.id, updates);
      set({ currentSession: updatedSession });

      socket.emit('update-session', {
        sessionId: currentSession.id,
        updates
      });
    } catch (error) {
      set({ error: 'セッションの更新に失敗しました' });
    }
  },

  setPomodoroState: (newState) => {
    set(state => ({
      pomodoroState: { ...state.pomodoroState, ...newState }
    }));
  },

  setError: (error) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  }
}));