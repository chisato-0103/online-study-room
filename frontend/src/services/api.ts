import axios from 'axios';
import type { StudySession, Location, CreateSessionDTO, UpdateSessionDTO, CreateFeedbackDTO } from '@shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const api = {
  // Session endpoints
  createSession: async (data: CreateSessionDTO): Promise<StudySession> => {
    const response = await apiClient.post('/sessions', data);
    return response.data;
  },

  getActiveSessions: async (): Promise<StudySession[]> => {
    const response = await apiClient.get('/sessions/active');
    return response.data;
  },

  updateSession: async (id: number, data: UpdateSessionDTO): Promise<StudySession> => {
    const response = await apiClient.put(`/sessions/${id}`, data);
    return response.data;
  },

  endSession: async (id: number): Promise<void> => {
    await apiClient.delete(`/sessions/${id}`);
  },

  // Location endpoints
  getLocations: async (): Promise<Location[]> => {
    const response = await apiClient.get('/locations');
    return response.data;
  },

  // Feedback endpoints
  submitFeedback: async (data: CreateFeedbackDTO): Promise<void> => {
    await apiClient.post('/feedback', data);
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};