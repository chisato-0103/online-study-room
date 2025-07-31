// テスト環境のセットアップファイル
// このファイルはすべてのテストファイルが実行される前に一度だけ実行されます

import '@testing-library/jest-dom'

// Socket.ioのモック設定
vi.mock('./services/socket', () => ({
  socket: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  }
}))

// Notification APIのモック（ポモドーロタイマーで使用）
Object.defineProperty(window, 'Notification', {
  value: class MockNotification {
    static permission = 'granted'
    static requestPermission = vi.fn().mockResolvedValue('granted')
    constructor(title: string, options?: NotificationOptions) {
      // モック通知の作成
    }
  },
  writable: true
})

// Navigator vibrate APIのモック
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  writable: true
})

// matchMediaのモック（レスポンシブデザインテスト用）
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})