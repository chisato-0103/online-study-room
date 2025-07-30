// ===== インポート =====
// Reactライブラリのメイン部分
import React from 'react';
// アプリ全体の状態管理ストア
import { useAppStore } from '../store/appStore';
// このコンポーネントのスタイルシート
import './StudyRoomMap.css';

/**
 * ===== 学習室マップコンポーネント =====
 * 
 * メイン画面の中心部分に表示される学習室の状況を示すマップです。
 * 
 * 【表示内容】
 * - 各学習場所のカード一覧（図書館、1号館1F、2F、その他）
 * - 各場所の現在の利用者数
 * - 利用者のニックネームとアバター
 * - 学習時間（滞在時間）と学習科目
 * - 総利用者数と最終更新時刻
 * 
 * 【機能】
 * - リアルタイムで利用者の入退室を反映
 * - 各場所の利用状況を一目で確認
 * - 学習時間の表示（公開設定したユーザーのみ）
 * - 8人以上の場合は「+N人」で省略表示
 */
const StudyRoomMap: React.FC = () => {
  // ===== 状態管理からの値取得 =====
  const { 
    locations,      // 利用可能な学習場所一覧
    activeSessions, // 現在アクティブな学習セッション一覧
    locationStats   // 各場所の利用者数統計
  } = useAppStore();

  // ===== 場所別利用者数取得関数 =====
  // 指定された学習場所の現在の利用者数を取得
  const getLocationCount = (locationName: string) => {
    const stat = locationStats.find(s => s.location === locationName);
    return stat ? stat.count : 0; // 統計があればその数値、なければ0を返す
  };

  // ===== 場所別セッション取得関数 =====
  // 指定された学習場所にいるユーザーのセッション一覧を取得
  const getSessionsForLocation = (locationName: string) => {
    return activeSessions.filter(session => 
      session.location === locationName ||  // 指定された場所と一致
      (!session.location && locationName === 'other') // 場所未指定の場合は「その他」に振り分け
    );
  };

  // ===== 学習時間フォーマット関数 =====
  // セッション開始から現在までの経過時間を日本語形式で表示
  const formatDuration = (createdAt: string) => {
    const start = new Date(createdAt);  // セッション開始時刻
    const now = new Date();             // 現在時刻
    const diffMs = now.getTime() - start.getTime(); // 経過時間（ミリ秒）
    const diffMins = Math.floor(diffMs / (1000 * 60)); // 経過時間（分）
    
    // 1時間未満の場合は「N分」で表示
    if (diffMins < 60) {
      return `${diffMins}分`;
    } else {
      // 1時間以上の場合は「N時間M分」で表示
      const hours = Math.floor(diffMins / 60); // 時間部分
      const mins = diffMins % 60;              // 分部分（余り）
      return `${hours}時間${mins}分`;
    }
  };

  // ===== コンポーネントのレンダリング =====
  return (
    <div className="study-room-map">
      {/* タイトル */}
      <h2>自習室マップ</h2>
      
      {/* ===== 学習場所一覧グリッド ===== */}
      <div className="locations-grid">
        {/* 各学習場所をループで表示 */}
        {locations.map(location => {
          const count = getLocationCount(location.name);     // この場所の利用者数
          const sessions = getSessionsForLocation(location.name); // この場所のユーザー一覧
          
          return (
            <div key={location.id} className="location-card">
              {/* 各学習場所のヘッダー部分 */}
              <div className="location-header">
                {/* 場所名（ユーザーに表示される名前） */}
                <h3>{location.displayName}</h3>
                {/* 現在の利用者数バッジ */}
                <div className="user-count">
                  <span className="count-badge">{count}</span>
                  <span className="count-label">人</span>
                </div>
              </div>
              
              {/* 利用者一覧エリア */}
              <div className="users-list">
                {sessions.length === 0 ? (
                  /* 誰もいない場合の表示 */
                  <div className="empty-room">
                    現在、誰もいません
                  </div>
                ) : (
                  /* ユーザーがいる場合はアバターを表示（最大8人まで） */
                  sessions.slice(0, 8).map(session => (
                    <div key={session.id} className="user-avatar">
                      {/* ユーザーのアバターサークル（ニックネームの初文字） */}
                      <div className="avatar-circle">
                        {session.nickname.charAt(0)}
                      </div>
                      {/* ユーザー情報表示エリア */}
                      <div className="user-info">
                        {/* ニックネーム */}
                        <div className="user-nickname">
                          {session.nickname}
                        </div>
                        {/* 学習時間（公開設定したユーザーのみ表示） */}
                        {session.showDuration && (
                          <div className="user-duration">
                            {formatDuration(session.createdAt)}
                          </div>
                        )}
                        {/* 学習科目（設定したユーザーのみ表示） */}
                        {session.subject && (
                          <div className="user-subject">
                            {session.subject}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                
                {/* 8人を超える場合の省略表示 */}
                {sessions.length > 8 && (
                  <div className="more-users">
                    +{sessions.length - 8}人
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* ===== マップフッター（統計情報） ===== */}
      <div className="map-footer">
        {/* 総利用者数 */}
        <div className="total-users">
          総利用者数: <strong>{activeSessions.length}人</strong>
        </div>
        {/* 最終更新時刻（現在時刻を表示） */}
        <div className="last-updated">
          最終更新: {new Date().toLocaleTimeString('ja-JP')}
        </div>
      </div>
    </div>
  );
};

// コンポーネントをエクスポート（他のファイルから使用可能にする）
export default StudyRoomMap;