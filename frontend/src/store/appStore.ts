import { create } from 'zustand';
import type { StudySession, Location, PomodoroState } from '@shared/types';
import { api } from '../services/api';
import { socket } from '../services/socket';

interface AppState {
  currentSession: StudySession | null;
  locations: Location[];
  activeSessions: StudySession[];
  locationStats: { location: string; count: number }[];
  pomodoroState: PomodoroState;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeApp: () => Promise<void>;
  createSession: (sessionData: any) => Promise<void>;
  endSession: () => Promise<void>;
  updateSession: (updates: any) => Promise<void>;
  setPomodoroState: (state: Partial<PomodoroState>) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
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