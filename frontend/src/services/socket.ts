import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 ソケット接続完了:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 ソケット切断:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 ソケット接続エラー:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('ソケット未接続。接続を試行中...');
      this.connect().emit(event, data);
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socket = new SocketService().connect();