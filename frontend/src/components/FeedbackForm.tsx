// ===== インポート =====
// ReactライブラリとuseState（コンポーネント内状態管理）
import React, { useState } from 'react';
// API通信関数
 import { api } from '../services/api';
// このコンポーネントのスタイルシート
import './FeedbackForm.css';

/**
 * ===== フィードバックフォームコンポーネント =====
 * 
 * ユーザーからの意見・要望・バグ報告などを収集するフォームです。
 * 
 * 【表示内容】
 * - 未開時：「ご意見フォーム」ボタンのみ表示
 * - 開時：フルフォームを表示
 *   - カテゴリ選択（場所追加、不具合、機能要望、その他）
 *   - フィードバック内容テキストエリア（最大1000文字）
 *   - 文字数カウンター
 *   - キャンセルと送信ボタン
 *   - 1日1回制限の注意書き
 * 
 * 【機能】
 * - フォームの開閉切り替え
 * - 入力内容のバリデーション（空欄チェック）
 * - サーバーへのフィードバック送信
 * - 送信成功時の自動フォームクローズ（3秒後）
 * - エラーハンドリングとメッセージ表示
 */
const FeedbackForm: React.FC = () => {
  // ===== ローカル状態管理 =====
  const [isOpen, setIsOpen] = useState(false);           // フォームの開閉状態
  const [formData, setFormData] = useState({             // フォーム入力データ
    category: 'other' as 'location' | 'bug' | 'feature' | 'other', // カテゴリ
    content: ''                                          // フィードバック内容
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // 送信中フラグ
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null); // メッセージ表示用

  // ===== カテゴリラベルの定義 =====
  // プルダウンで表示されるカテゴリの選択肢
  const categoryLabels = {
    location: '場所追加',    // 新しい学習場所の追加要望
    bug: '不具合報告',       // バグや不具合の報告
    feature: '機能要望',      // 新機能の要望や改善提案
    other: 'その他'           // 上記以外の全般的な意見
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

  // ===== フォームが閉じている場合の表示 =====
  // ボタンのみを表示し、クリックでフォームを開く
  if (!isOpen) {
    return (
      <div className="feedback-trigger">
        <button
          className="btn btn-secondary feedback-btn"
          onClick={() => setIsOpen(true)} // クリックでフォームを開く
        >
          💬 ご意見フォーム
        </button>
      </div>
    );
  }

  // ===== フォームが開いている場合の表示 =====
  return (
    <div className="feedback-form">
      <div className="card">
        {/* フォームヘッダー（タイトルと閉じるボタン） */}
        <div className="feedback-header">
          <h3>ご意見・ご要望</h3>
          <button
            className="close-btn"
            onClick={() => setIsOpen(false)} // クリックでフォームを閉じる
            aria-label="閉じる"  // アクセシビリティ用ラベル
          >
            ✕
          </button>
        </div>

        {/* メッセージ表示エリア（成功/エラーメッセージ） */}
        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* ===== メインフォーム ===== */}
        <form onSubmit={handleSubmit} className="feedback-form-content">
          {/* カテゴリ選択フィールド */}
          <div className="form-group">
            <label htmlFor="category">カテゴリ</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isSubmitting} // 送信中は入力無効
            >
              {/* カテゴリラベルをループで表示 */}
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* フィードバック内容入力フィールド */}
          <div className="form-group">
            <label htmlFor="content">
              ご意見・ご要望 <span className="required">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="ご自由にお書きください..." // 入力のヒント
              rows={4}                    // 表示行数
              maxLength={1000}            // 最大1000文字まで
              disabled={isSubmitting}     // 送信中は入力無効
              required                    // 必須入力
            />
            {/* 文字数カウンター */}
            <div className="char-count">
              {formData.content.length}/1000
            </div>
          </div>

          {/* フォームアクションボタン */}
          <div className="form-actions">
            {/* キャンセルボタン（フォームを閉じる） */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}  // 送信中は無効
            >
              キャンセル
            </button>
            {/* 送信ボタン（フィードバックをサーバーに送信） */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !formData.content.trim()} // 送信中または内容が空の場合は無効
            >
              {/* 送信状態に応じてボタンテキストを変更 */}
              {isSubmitting ? '送信中...' : '送信'}
            </button>
          </div>
        </form>

        {/* 注意書きエリア */}
        <div className="feedback-note">
          <small>
            💡 フィードバックは1日1回まで送信可能です
          </small>
        </div>
      </div>
    </div>
  );
};

// コンポーネントをエクスポート（他のファイルから使用可能にする）
export default FeedbackForm;