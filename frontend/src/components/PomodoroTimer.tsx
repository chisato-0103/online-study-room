// ===== インポート =====
// ReactライブラリとuseEffect（副作用処理）、useRef（DOM要素参照）
import React, { useEffect, useRef } from 'react';
// アプリ全体の状態管理ストア
import { useAppStore } from '../store/appStore';
// このコンポーネントのスタイルシート
import './PomodoroTimer.css';

/**
 * ===== ポモドーロタイマーコンポーネント =====
 * 
 * ポモドーロテクニック用のタイマーコンポーネントです。
 * 25分集中 + 5分休憩のサイクルで学習効率を高める手法です。
 * 
 * 【表示内容】
 * - 現在のモード表示（集中時間/休憩中）
 * - セッション番号（何回目のポモドーロか）
 * - 円形の進行状況バーと残り時間
 * - 開始/一時停止/リセットボタン
 * - 次のフェーズの予告表示
 * - ブラウザ通知有効化ボタン
 * 
 * 【機能】
 * - 25分の集中時間と5分の休憩時間の自動切り替え
 * - タイマー終了時のブラウザ通知とバイブレーション
 * - 手動での開始/停止/リセット操作
 * - セッション数のカウント
 */
const PomodoroTimer: React.FC = () => {
  // ===== 状態管理からの値取得 =====
  const { pomodoroState, setPomodoroState } = useAppStore();
  const { timeLeft, isBreak, isActive, session } = pomodoroState;
  
  // ===== タイマーの参照保持用 =====
  const intervalRef = useRef<number | null>(null);

  // ===== 時間定数の定義 =====
  const WORK_TIME = 25 * 60;  // 25分（集中時間）
  const BREAK_TIME = 5 * 60;  // 5分（休憩時間）

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

  // ===== コンポーネントのレンダリング =====
  return (
    <div className={`pomodoro-timer ${isBreak ? 'break-mode' : 'work-mode'}`}>
      <div className="card">
        {/* ===== タイマーヘッダー（モード表示） ===== */}
        <div className="timer-header">
          <h3>
            {/* 現在のモードに応じてアイコンとテキストを切り替え */}
            {isBreak ? '🧘 休憩中' : '📚 集中時間'}
          </h3>
          {/* 現在のセッション番号表示 */}
          <div className="session-counter">
            セッション {session}
          </div>
        </div>

        {/* ===== タイマー表示エリア ===== */}
        <div className="timer-display">
          <div className="time-circle">
            {/* 円形の進行状況バー（SVGで描画） */}
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
            {/* 中央に残り時間を表示 */}
            <div className="time-text">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* ===== タイマー操作ボタン ===== */}
        <div className="timer-controls">
          {/* 開始/一時停止ボタン（状態に応じてテキストとスタイル変更） */}
          <button
            className={`btn ${isActive ? 'btn-danger' : 'btn-success'}`}
            onClick={toggleTimer}
          >
            {isActive ? '⏸️ 一時停止' : '▶️ 開始'}
          </button>
          {/* リセットボタン（タイマーを初期状態に戻す） */}
          <button
            className="btn btn-secondary"
            onClick={resetTimer}
          >
            🔄 リセット
          </button>
        </div>

        {/* ===== タイマー情報エリア ===== */}
        <div className="timer-info">
          {/* 次のフェーズの予告 */}
          <div className="next-phase">
            次は: {isBreak ? '作業時間 (25分)' : '休憩時間 (5分)'}
          </div>
          {/* ブラウザ通知が未許可の場合のみ表示 */}
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

// コンポーネントをエクスポート（他のファイルから使用可能にする）
export default PomodoroTimer;