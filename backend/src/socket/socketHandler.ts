// ===== インポート =====
// Socket.ioのサーバーとクライアントの型定義
import { Server, Socket } from 'socket.io';
// 共通で使うデータ型の定義
import type { StudySession, UpdateSessionDTO } from '@shared/types/index.js';
// セッションストレージを共有
import { sessions } from '../routes/sessionRoutes.js';

// ===== 型定義 =====
// ソケットに保存するデータの型
interface SocketData {
  sessionId?: number;  // セッションID（オプション）
  location?: string;   // 学習場所（オプション）
}

// ===== グローバル状態管理 =====
// ソケットIDとセッションIDのマッピング（ソケットID -> セッションID）
const socketSessionMap = new Map<string, number>();
// 各場所の現在の人数を保存（場所名 -> 人数）
const locationCounts = new Map<string, number>();

// ===== メイン関数 =====
// Socket.ioサーバーの初期化とイベントリスナーの設定
export const setupSocket = (io: Server) => {
  // クライアントがサーバーに接続したときの処理
  io.on('connection', (socket: Socket) => {
    console.log(`クライアント接続: ${socket.id}`);

    // 接続時に現在のアクティブセッション一覧を送信
    const activeSessions = Array.from(sessions.values()).filter(session => session.isActive);
    socket.emit('active-sessions', activeSessions);

    // 場所統計を再計算（実際のアクティブセッションに基づいて）
    recalculateLocationStats();

    // 接続時に現在の各場所の人数統計を送信
    socket.emit('room-stats', Array.from(locationCounts.entries()).map(([location, count]) => ({
      location,
      count
    })));

    // ===== ルーム参加処理 =====
    // ユーザーが学習ルームに参加するときの処理
    socket.on('join-room', async (data: { sessionId: number; session: StudySession }) => {
      try {
        const { sessionId, session } = data;

        // ソケットIDとセッションIDをマッピング
        socketSessionMap.set(socket.id, sessionId);
        // ソケットにメタデータを保存
        socket.data = { sessionId, location: session.location };

        // 学習場所が指定されている場合
        if (session.location) {
          // その場所のルームに参加
          socket.join(session.location);
          // 場所の人数を更新（+1）
          updateLocationCount(session.location, 1);
        }

        // 他のユーザーに新しいユーザーの参加を通知
        socket.broadcast.emit('user-joined', session);

        // 全ユーザーに各場所の人数統計を送信
        io.emit('room-stats', Array.from(locationCounts.entries()).map(([location, count]) => ({
          location,
          count
        })));

        console.log(`ユーザー ${session.nickname} が ${session.location || 'その他自習室'} に参加しました`);
      } catch (error) {
        console.error('join-room エラー:', error);
        socket.emit('error', { message: 'ルームへの参加に失敗しました' });
      }
    });

    // ===== ルーム退室処理 =====
    // ユーザーが手動でルームから退室するときの処理
    socket.on('leave-room', () => {
      handleUserLeave(socket);
    });

    // ===== セッション更新処理 =====
    // ユーザーが学習セッションを更新するときの処理（場所変更、ステータス変更など）
    socket.on('update-session', (data: { sessionId: number; updates: UpdateSessionDTO }) => {
      try {
        const { sessionId, updates } = data;
        // 共有ストレージから現在のセッション情報を取得
        const currentSession = sessions.get(sessionId);

        if (currentSession) {
          // 新しい情報でセッションを更新
          const updatedSession = { ...currentSession, ...updates, updatedAt: new Date().toISOString() };
          sessions.set(sessionId, updatedSession);

          // 学習場所が変更された且、新しい場所が指定されている場合
          if (currentSession.location !== updates.location && updates.location) {
            // 古い場所から退室
            if (currentSession.location) {
              socket.leave(currentSession.location);
              updateLocationCount(currentSession.location, -1);
            }
            // 新しい場所に参加
            socket.join(updates.location);
            updateLocationCount(updates.location, 1);
            socket.data.location = updates.location;
          }

          // 他のユーザーにセッション更新を通知
          socket.broadcast.emit('session-updated', updatedSession);

          // 全ユーザーに各場所の人数統計を送信
          io.emit('room-stats', Array.from(locationCounts.entries()).map(([location, count]) => ({
            location,
            count
          })));
        }
      } catch (error) {
        console.error('update-session エラー:', error);
        socket.emit('error', { message: 'セッションの更新に失敗しました' });
      }
    });

    // ===== 切断処理 =====
    // クライアントがサーバーから切断したときの処理
    socket.on('disconnect', () => {
      handleUserLeave(socket);
      console.log(`クライアント切断: ${socket.id}`);
    });
  });
};

// ===== ユーザー退室処理関数 =====
// ユーザーがルームから退室するときの共通処理
const handleUserLeave = (socket: Socket) => {
  // ソケットのメタデータを取得
  const socketData = socket.data as SocketData;
  const sessionId = socketSessionMap.get(socket.id);

  // セッションIDが設定されている場合
  if (sessionId && socketData.sessionId) {
    // 学習場所が設定されている場合
    if (socketData.location) {
      // その場所のルームから退室
      socket.leave(socketData.location);
      // 場所の人数を更新（-1）
      updateLocationCount(socketData.location, -1);
    }

    // 他のユーザーにユーザーの退室を通知
    socket.broadcast.emit('user-left', { sessionId: socketData.sessionId });

    // ソケットセッションマッピングから削除
    socketSessionMap.delete(socket.id);

    // 全ユーザーに更新された各場所の人数統計を送信
    socket.broadcast.emit('room-stats', Array.from(locationCounts.entries()).map(([location, count]) => ({
      location,
      count
    })));
  }
};

// ===== 場所人数更新関数 =====
// 指定された学習場所の人数を更新する関数
const updateLocationCount = (location: string, delta: number) => {
  // 現在の人数を取得（なければ0）
  const currentCount = locationCounts.get(location) || 0;
  // 新しい人数を計算（負の値にならないように0以上を保証）
  const newCount = Math.max(0, currentCount + delta);

  // 人数が0になった場合はマップから削除
  if (newCount === 0) {
    locationCounts.delete(location);
  } else {
    // そうでなければ新しい人数を設定
    locationCounts.set(location, newCount);
  }
};

// ===== 場所統計再計算関数 =====
// 実際のアクティブセッションに基づいて場所統計を再計算する関数
const recalculateLocationStats = () => {
  // 統計をクリア
  locationCounts.clear();
  
  // 全アクティブセッションを取得
  const activeSessions = Array.from(sessions.values()).filter(session => session.isActive);
  
  // 各セッションの場所を集計
  activeSessions.forEach(session => {
    if (session.location) {
      const currentCount = locationCounts.get(session.location) || 0;
      locationCounts.set(session.location, currentCount + 1);
    }
  });
};
