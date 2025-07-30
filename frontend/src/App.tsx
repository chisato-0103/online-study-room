import React, { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import Header from './components/Header';
import UserRegistration from './components/UserRegistration';
import StudyRoomMap from './components/StudyRoomMap';
import PomodoroTimer from './components/PomodoroTimer';
import FeedbackForm from './components/FeedbackForm';
import './App.css';

function App() {
  const { currentSession, initializeApp } = useAppStore();

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  if (!currentSession) {
    return (
      <div className="app">
        <Header />
        <main className="container">
          <div className="welcome-section">
            <h1>オンライン自習室へようこそ</h1>
            <p>学習の可視化で、みんなで一緒に頑張りましょう！</p>
            <UserRegistration />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <main className="container">
        <div className="app-layout">
          <div className="left-panel">
            <PomodoroTimer />
            <FeedbackForm />
          </div>
          <div className="main-content">
            <StudyRoomMap />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;