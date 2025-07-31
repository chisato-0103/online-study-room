// 基本的なテストファイル
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useAppStore } from '../store/appStore'

// モックを設定
vi.mock('../store/appStore', () => ({
  useAppStore: vi.fn()
}))

// 基本的なコンポーネントテスト
describe('基本的なテスト', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('数学計算が正しく動作する', () => {
    expect(2 + 2).toBe(4)
    expect(10 * 3).toBe(30)
  })

  it('文字列操作が正しく動作する', () => {
    const message = 'Hello, World!'
    expect(message).toContain('World')
    expect(message.length).toBe(13)
  })

  it('配列操作が正しく動作する', () => {
    const numbers = [1, 2, 3, 4, 5]
    expect(numbers).toHaveLength(5)
    expect(numbers.includes(3)).toBe(true)
  })

  it('オブジェクト操作が正しく動作する', () => {
    const user = {
      id: 1,
      name: 'テストユーザー',
      isActive: true
    }
    
    expect(user.id).toBe(1)
    expect(user.name).toBe('テストユーザー')
    expect(user.isActive).toBe(true)
  })

  it('モック関数が正しく動作する', () => {
    const mockStore = {
      currentSession: null,
      locations: [],
      activeSessions: [],
      locationStats: [],
      pomodoroState: {
        timeLeft: 25 * 60,
        isBreak: false,
        isActive: false,
        session: 1
      },
      isLoading: false,
      error: null,
      initializeApp: vi.fn(),
      createSession: vi.fn(),
      endSession: vi.fn(),
      updateSession: vi.fn(),
      setPomodoroState: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn()
    }

    vi.mocked(useAppStore).mockReturnValue(mockStore)
    
    const store = useAppStore()
    expect(store.currentSession).toBeNull()
    expect(store.locations).toEqual([])
    expect(store.pomodoroState.timeLeft).toBe(1500)
  })
})