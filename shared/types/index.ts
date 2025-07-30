export interface User {
  id: number;
  nickname: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: number;
  userId?: number;
  nickname: string;
  location?: string;
  subject?: string;
  scheduledEndTime: string;
  actualEndTime?: string;
  isActive: boolean;
  showDuration: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: number;
  name: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
}

export interface Feedback {
  id: number;
  category: 'location' | 'bug' | 'feature' | 'other';
  content: string;
  userIp?: string;
  createdAt: string;
}

export interface PomodoroState {
  timeLeft: number;
  isBreak: boolean;
  isActive: boolean;
  session: number;
}

export interface CreateSessionDTO {
  nickname: string;
  location?: string;
  subject?: string;
  scheduledEndTime: string;
  showDuration?: boolean;
}

export interface UpdateSessionDTO {
  location?: string;
  subject?: string;
  scheduledEndTime?: string;
  showDuration?: boolean;
}

export interface CreateFeedbackDTO {
  category: 'location' | 'bug' | 'feature' | 'other';
  content: string;
}

export interface SocketEvents {
  'join-room': (data: { userId?: number; location: string }) => void;
  'leave-room': (data: { userId?: number }) => void;
  'update-session': (data: { sessionId: number; updates: UpdateSessionDTO }) => void;
  'user-joined': (data: StudySession) => void;
  'user-left': (data: { sessionId: number }) => void;
  'session-updated': (data: StudySession) => void;
  'room-stats': (data: { location: string; count: number }[]) => void;
}