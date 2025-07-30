import React, { useState } from 'react';
import { api } from '../services/api';
import './FeedbackForm.css';

const FeedbackForm: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'other' as 'location' | 'bug' | 'feature' | 'other',
    content: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const categoryLabels = {
    location: '場所追加',
    bug: '不具合報告',
    feature: '機能要望',
    other: 'その他'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      setMessage({ type: 'error', text: 'フィードバック内容を入力してください。' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await api.submitFeedback(formData);
      setMessage({ 
        type: 'success', 
        text: 'フィードバックをありがとうございます！ご意見を参考にサービス改善に努めます。' 
      });
      setFormData({ category: 'other', content: '' });
      
      // 3秒後にフォームを閉じる
      setTimeout(() => {
        setIsOpen(false);
        setMessage(null);
      }, 3000);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'フィードバックの送信に失敗しました。' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) {
    return (
      <div className="feedback-trigger">
        <button
          className="btn btn-secondary feedback-btn"
          onClick={() => setIsOpen(true)}
        >
          💬 ご意見フォーム
        </button>
      </div>
    );
  }

  return (
    <div className="feedback-form">
      <div className="card">
        <div className="feedback-header">
          <h3>ご意見・ご要望</h3>
          <button
            className="close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="feedback-form-content">
          <div className="form-group">
            <label htmlFor="category">カテゴリ</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="content">
              ご意見・ご要望 <span className="required">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="ご自由にお書きください..."
              rows={4}
              maxLength={1000}
              disabled={isSubmitting}
              required
            />
            <div className="char-count">
              {formData.content.length}/1000
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !formData.content.trim()}
            >
              {isSubmitting ? '送信中...' : '送信'}
            </button>
          </div>
        </form>

        <div className="feedback-note">
          <small>
            💡 フィードバックは1日1回まで送信可能です
          </small>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;