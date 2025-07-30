import { Server, Socket } from 'socket.io';
import type { StudySession, UpdateSessionDTO } from '@shared/types/index.js';

interface SocketData {
  sessionId?: number;
  location?: string;
}

const activeSessions = new Map<string, StudySession>();
const locationCounts = new Map<string, number>();

export const setupSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-room', async (data: { sessionId: number; session: StudySession }) => {
      try {
        const { sessionId, session } = data;
        
        activeSessions.set(socket.id, session);
        socket.data = { sessionId, location: session.location };
        
        if (session.location) {
          socket.join(session.location);
          updateLocationCount(session.location, 1);
        }

        socket.broadcast.emit('user-joined', session);
        
        io.emit('room-stats', Array.from(locationCounts.entries()).map(([location, count]) => ({
          location,
          count
        })));

        console.log(`User ${session.nickname} joined ${session.location || 'その他自習室'}`);
      } catch (error) {
        console.error('Error in join-room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('leave-room', () => {
      handleUserLeave(socket);
    });

    socket.on('update-session', (data: { sessionId: number; updates: UpdateSessionDTO }) => {
      try {
        const { sessionId, updates } = data;
        const currentSession = activeSessions.get(socket.id);
        
        if (currentSession) {
          const updatedSession = { ...currentSession, ...updates };
          activeSessions.set(socket.id, updatedSession);
          
          if (currentSession.location !== updates.location && updates.location) {
            if (currentSession.location) {
              socket.leave(currentSession.location);
              updateLocationCount(currentSession.location, -1);
            }
            socket.join(updates.location);
            updateLocationCount(updates.location, 1);
            socket.data.location = updates.location;
          }

          socket.broadcast.emit('session-updated', updatedSession);
          
          io.emit('room-stats', Array.from(locationCounts.entries()).map(([location, count]) => ({
            location,
            count
          })));
        }
      } catch (error) {
        console.error('Error in update-session:', error);
        socket.emit('error', { message: 'Failed to update session' });
      }
    });

    socket.on('disconnect', () => {
      handleUserLeave(socket);
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

const handleUserLeave = (socket: Socket) => {
  const session = activeSessions.get(socket.id);
  const socketData = socket.data as SocketData;
  
  if (session && socketData.sessionId) {
    if (socketData.location) {
      socket.leave(socketData.location);
      updateLocationCount(socketData.location, -1);
    }

    socket.broadcast.emit('user-left', { sessionId: socketData.sessionId });
    
    activeSessions.delete(socket.id);
    
    socket.broadcast.emit('room-stats', Array.from(locationCounts.entries()).map(([location, count]) => ({
      location,
      count
    })));
  }
};

const updateLocationCount = (location: string, delta: number) => {
  const currentCount = locationCounts.get(location) || 0;
  const newCount = Math.max(0, currentCount + delta);
  
  if (newCount === 0) {
    locationCounts.delete(location);
  } else {
    locationCounts.set(location, newCount);
  }
};