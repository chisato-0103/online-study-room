import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import './PomodoroTimer.css';

const PomodoroTimer: React.FC = () => {
  const { pomodoroState, setPomodoroState } = useAppStore();
  const { timeLeft, isBreak, isActive, session } = pomodoroState;
  const intervalRef = useRef<number | null>(null);

  const WORK_TIME = 25 * 60; // 25分
  const BREAK_TIME = 5 * 60; // 5分

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setPomodoroState({ timeLeft: timeLeft - 1 });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerComplete();
    } else {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft, setPomodoroState]);

  const handleTimerComplete = () => {
    // ブラウザ通知
    if (Notification.permission === 'granted') {
      new Notification(
        isBreak ? '休憩終了！' : 'ポモドーロ完了！',
        {
          body: isBreak ? '作業を再開しましょう' : '5分間休憩しましょう',
          icon: '/favicon.ico'
        }
      );
    }

    // バイブレーション
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    if (isBreak) {
      // 休憩終了 → 次のセッション開始
      setPomodoroState({
        timeLeft: WORK_TIME,
        isBreak: false,
        session: session + 1,
        isActive: false
      });
    } else {
      // 作業終了 → 休憩開始
      setPomodoroState({
        timeLeft: BREAK_TIME,
        isBreak: true,
        isActive: false
      });
    }
  };

  const toggleTimer = () => {
    setPomodoroState({ isActive: !isActive });
  };

  const resetTimer = () => {
    setPomodoroState({
      timeLeft: isBreak ? BREAK_TIME : WORK_TIME,
      isActive: false
    });
  };

  const requestNotificationPermission = () => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalTime = isBreak ? BREAK_TIME : WORK_TIME;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <div className={`pomodoro-timer ${isBreak ? 'break-mode' : 'work-mode'}`}>
      <div className="card">
        <div className="timer-header">
          <h3>
            {isBreak ? '🧘 休憩中' : '📚 集中時間'}
          </h3>
          <div className="session-counter">
            セッション {session}
          </div>
        </div>

        <div className="timer-display">
          <div className="time-circle">
            <svg width="120" height="120" className="progress-ring">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke={isBreak ? '#10b981' : '#3b82f6'}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - getProgress() / 100)}`}
                transform="rotate(-90 60 60)"
                className="progress-circle"
              />
            </svg>
            <div className="time-text">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        <div className="timer-controls">
          <button
            className={`btn ${isActive ? 'btn-danger' : 'btn-success'}`}
            onClick={toggleTimer}
          >
            {isActive ? '⏸️ 一時停止' : '▶️ 開始'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={resetTimer}
          >
            🔄 リセット
          </button>
        </div>

        <div className="timer-info">
          <div className="next-phase">
            次は: {isBreak ? '作業時間 (25分)' : '休憩時間 (5分)'}
          </div>
          {Notification.permission === 'default' && (
            <button
              className="btn btn-sm btn-secondary notification-btn"
              onClick={requestNotificationPermission}
            >
              🔔 通知を有効にする
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;