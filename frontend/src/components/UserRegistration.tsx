import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import './UserRegistration.css';

const UserRegistration: React.FC = () => {
  const { createSession, locations, isLoading, error, clearError } = useAppStore();
  const [formData, setFormData] = useState({
    nickname: '',
    location: '',
    subject: '',
    scheduledEndTime: '',
    showDuration: true
  });

  useEffect(() => {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    setFormData(prev => ({
      ...prev,
      scheduledEndTime: now.toISOString().slice(0, 16)
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!formData.nickname.trim()) {
      return;
    }

    if (formData.nickname.includes('本名') || 
        /[一-龯]{4,}/.test(formData.nickname)) {
      alert('本名の使用は禁止されています。ニックネームを使用してください。');
      return;
    }

    try {
      await createSession({
        nickname: formData.nickname.trim(),
        location: formData.location || undefined,
        subject: formData.subject || undefined,
        scheduledEndTime: formData.scheduledEndTime,
        showDuration: formData.showDuration
      });
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="user-registration">
      <div className="card">
        <h2>学習セッションを開始</h2>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="nickname">
              ニックネーム <span className="required">*</span>
            </label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="例: 頑張る太郎"
              maxLength={50}
              required
            />
            <small className="form-help">
              ⚠️ 本名の使用は禁止されています
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="location">学習場所</label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
            >
              <option value="">その他自習室</option>
              {locations.map(location => (
                <option key={location.id} value={location.name}>
                  {location.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">学習科目（任意）</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="例: 数学、英語、プログラミング"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="scheduledEndTime">
              退室予定時刻 <span className="required">*</span>
            </label>
            <input
              type="datetime-local"
              id="scheduledEndTime"
              name="scheduledEndTime"
              value={formData.scheduledEndTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="showDuration"
                checked={formData.showDuration}
                onChange={handleChange}
              />
              滞在時間を他のユーザーに公開する
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? '開始中...' : '学習を開始する'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserRegistration;