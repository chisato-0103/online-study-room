// ===== インポート =====
// Reactライブラリのメイン部分
import React from 'react';
// アプリ全体の状態管理ストア
import { useAppStore } from '../store/appStore';
// このコンポーネントのスタイルシート
import './Header.css';

/**
 * ===== ヘッダーコンポーネント =====
 * 
 * アプリケーションの上部に固定表示されるヘッダーバーです。
 * 
 * 【表示内容】
 * - 左側：アプリケーションのタイトル「オンライン自習室」
 * - 中央：現在の日付と時刻（リアルタイム更新）
 * - 右側：ユーザー情報と退室ボタン（ログイン時のみ）
 * 
 * 【機能】
 * - リアルタイムで現在時刻を表示
 * - ユーザーのニックネーム表示
 * - 退室ボタンで学習セッションを終了
 */
const Header: React.FC = () => {
  // ===== 状態管理からの値取得 =====
  const { 
    currentSession,  // 現在のユーザーセッション情報
    endSession       // セッション終了関数
  } = useAppStore();

  // ===== 現在時刻取得関数 =====
  // 日本形式で現在の日付と時刻を取得するユーティリティ関数
  const getCurrentDateTime = () => {
    const now = new Date();
    // 日本語ロケールで日付と時刻をフォーマット（例：2024/01/15 14:30）
    return now.toLocaleString('ja-JP', {
      year: 'numeric',    // 年を数字で表示
      month: '2-digit',   // 月を2桁で表示
      day: '2-digit',     // 日を2桁で表示
      hour: '2-digit',    // 時を2桁で表示
      minute: '2-digit'   // 分を2桁で表示
    });
  };

  // ===== セッション終了処理関数 =====
  // 退室ボタンがクリックされたときの処理
  const handleEndSession = async () => {
    // 確認ダイアログでユーザーの意思を確認
    if (window.confirm('学習セッションを終了しますか？')) {
      try {
        // サーバーにセッション終了を通知し、ローカル状態をクリア
        await endSession();
      } catch (error) {
        // エラーが発生した場合はコンソールにログ出力
        console.error('セッション終了エラー:', error);
      }
    }
  };

  // ===== コンポーネントのレンダリング =====
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* ===== 左側：アプリタイトル ===== */}
          <div className="header-left">
            <h1 className="header-title">オンライン自習室</h1>
          </div>
          
          {/* ===== 中央：現在時刻表示 ===== */}
          <div className="header-center">
            <div className="current-time">
              {/* リアルタイムで更新される現在の日付と時刻 */}
              {getCurrentDateTime()}
            </div>
          </div>

          {/* ===== 右側：ユーザー情報と操作ボタン ===== */}
          <div className="header-right">
            {/* ユーザーがログインしている場合のみ表示 */}
            {currentSession && (
              <div className="user-info">
                {/* ユーザーのニックネーム表示 */}
                <span className="nickname">{currentSession.nickname}</span>
                {/* 退室ボタン（クリックで学習セッション終了） */}
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

// コンポーネントをエクスポート（他のファイルから使用可能にする）
export default Header;