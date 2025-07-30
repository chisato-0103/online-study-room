// Reactをインポート - useEffectはコンポーネントの初期化時に実行するためのフック
import { useEffect } from 'react';

// アプリ全体の状態管理を行うZustandストア（データの中央管理）
import { useAppStore } from './store/appStore';

// 各画面パーツ（コンポーネント）をインポート
import Header from './components/Header';           // 上部のヘッダー（タイトル、時計など）
import UserRegistration from './components/UserRegistration'; // ユーザー登録フォーム
import StudyRoomMap from './components/StudyRoomMap';         // 自習室マップ（メイン画面）
import PomodoroTimer from './components/PomodoroTimer';       // ポモドーロタイマー
import FeedbackForm from './components/FeedbackForm';         // ご意見フォーム

// スタイル（見た目）を適用
import './App.css';

/**
 * メインのAppコンポーネント
 * アプリ全体の表示を制御します
 */
function App() {
  // ストア（データ保管庫）から現在のセッション情報とアプリ初期化関数を取得
  const { currentSession, initializeApp } = useAppStore();

  // コンポーネントが最初に表示される時に1回だけ実行される処理
  useEffect(() => {
    // アプリを初期化（サーバーからデータを取得など）
    initializeApp();
  }, [initializeApp]); // initializeAppが変更された時だけ再実行

  // まだログインしていない場合（currentSessionがない場合）
  if (!currentSession) {
    return (
      <div className="app">
        {/* ヘッダー部分（上部の共通部分） */}
        <Header />
        
        {/* メインコンテンツ */}
        <main className="container">
          <div className="welcome-section">
            <h1>オンライン自習室へようこそ</h1>
            <p>学習の可視化で、みんなで一緒に頑張りましょう！</p>
            
            {/* ユーザー登録フォームを表示 */}
            <UserRegistration />
          </div>
        </main>
      </div>
    );
  }

  // ログイン済みの場合のメイン画面
  return (
    <div className="app">
      {/* ヘッダー部分 */}
      <Header />
      
      {/* メインコンテンツ */}
      <main className="container">
        <div className="app-layout">
          {/* 左側パネル */}
          <div className="left-panel">
            <PomodoroTimer />  {/* ポモドーロタイマー */}
            <FeedbackForm />   {/* フィードバックフォーム */}
          </div>
          
          {/* 右側メインコンテンツ */}
          <div className="main-content">
            <StudyRoomMap />   {/* 自習室マップ */}
          </div>
        </div>
      </main>
    </div>
  );
}

// このコンポーネントを他のファイルから使えるようにエクスポート
export default App;