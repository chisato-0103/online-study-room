import React from 'react';
import { useAppStore } from '../store/appStore';
import './StudyRoomMap.css';

const StudyRoomMap: React.FC = () => {
  const { locations, activeSessions, locationStats } = useAppStore();

  const getLocationCount = (locationName: string) => {
    const stat = locationStats.find(s => s.location === locationName);
    return stat ? stat.count : 0;
  };

  const getSessionsForLocation = (locationName: string) => {
    return activeSessions.filter(session => 
      session.location === locationName || 
      (!session.location && locationName === 'other')
    );
  };

  const formatDuration = (createdAt: string) => {
    const start = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}分`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}時間${mins}分`;
    }
  };

  return (
    <div className="study-room-map">
      <h2>自習室マップ</h2>
      
      <div className="locations-grid">
        {locations.map(location => {
          const count = getLocationCount(location.name);
          const sessions = getSessionsForLocation(location.name);
          
          return (
            <div key={location.id} className="location-card">
              <div className="location-header">
                <h3>{location.displayName}</h3>
                <div className="user-count">
                  <span className="count-badge">{count}</span>
                  <span className="count-label">人</span>
                </div>
              </div>
              
              <div className="users-list">
                {sessions.length === 0 ? (
                  <div className="empty-room">
                    現在、誰もいません
                  </div>
                ) : (
                  sessions.slice(0, 8).map(session => (
                    <div key={session.id} className="user-avatar">
                      <div className="avatar-circle">
                        {session.nickname.charAt(0)}
                      </div>
                      <div className="user-info">
                        <div className="user-nickname">
                          {session.nickname}
                        </div>
                        {session.showDuration && (
                          <div className="user-duration">
                            {formatDuration(session.createdAt)}
                          </div>
                        )}
                        {session.subject && (
                          <div className="user-subject">
                            {session.subject}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                
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
      
      <div className="map-footer">
        <div className="total-users">
          総利用者数: <strong>{activeSessions.length}人</strong>
        </div>
        <div className="last-updated">
          最終更新: {new Date().toLocaleTimeString('ja-JP')}
        </div>
      </div>
    </div>
  );
};

export default StudyRoomMap;