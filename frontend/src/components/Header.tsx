import React from 'react';
import { useAppStore } from '../store/appStore';
import './Header.css';

const Header: React.FC = () => {
  const { currentSession, endSession } = useAppStore();

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEndSession = async () => {
    if (window.confirm('学習セッションを終了しますか？')) {
      try {
        await endSession();
      } catch (error) {
        console.error('Failed to end session:', error);
      }
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">オンライン自習室</h1>
          </div>
          
          <div className="header-center">
            <div className="current-time">
              {getCurrentDateTime()}
            </div>
          </div>

          <div className="header-right">
            {currentSession && (
              <div className="user-info">
                <span className="nickname">{currentSession.nickname}</span>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={handleEndSession}
                >
                  退室
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;