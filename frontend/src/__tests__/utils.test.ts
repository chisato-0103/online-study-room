// ユーティリティ関数のテスト
import { describe, it, expect } from 'vitest'

// 時間フォーマット関数
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 経過時間計算関数
const calculateElapsedTime = (startTime: string): number => {
  const start = new Date(startTime).getTime()
  const now = new Date().getTime()
  return Math.floor((now - start) / 1000)
}

// 進行状況計算関数
const calculateProgress = (timeLeft: number, totalTime: number): number => {
  return Math.round(((totalTime - timeLeft) / totalTime) * 100)
}

describe('ユーティリティ関数', () => {
  describe('formatTime', () => {
    it('秒を分:秒の形式に変換する', () => {
      expect(formatTime(0)).toBe('00:00')
      expect(formatTime(30)).toBe('00:30')
      expect(formatTime(60)).toBe('01:00')
      expect(formatTime(90)).toBe('01:30')
      expect(formatTime(1500)).toBe('25:00') // 25分
    })

    it('大きな値も正しく処理する', () => {
      expect(formatTime(3600)).toBe('60:00') // 1時間
      expect(formatTime(3661)).toBe('61:01') // 1時間1分1秒
    })
  })

  describe('calculateElapsedTime', () => {
    it('経過時間を正しく計算する', () => {
      const now = new Date()
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
      
      const elapsed = calculateElapsedTime(oneMinuteAgo.toISOString())
      expect(elapsed).toBeCloseTo(60, 1) // 約60秒（1秒の誤差許容）
    })

    it('現在時刻では0秒を返す', () => {
      const now = new Date()
      const elapsed = calculateElapsedTime(now.toISOString())
      expect(elapsed).toBeCloseTo(0, 1)
    })
  })

  describe('calculateProgress', () => {
    it('進行状況を正しく計算する', () => {
      expect(calculateProgress(1500, 1500)).toBe(0) // 開始時
      expect(calculateProgress(750, 1500)).toBe(50) // 半分
      expect(calculateProgress(0, 1500)).toBe(100) // 完了時
    })

    it('端数を正しく処理する', () => {
      expect(calculateProgress(1000, 1500)).toBe(33) // 33.33... -> 33
      expect(calculateProgress(500, 1500)).toBe(67) // 66.66... -> 67
    })
  })

  describe('データ検証', () => {
    it('有効なニックネームかチェック', () => {
      const isValidNickname = (nickname: string): boolean => {
        return nickname.length >= 1 && nickname.length <= 50 && !nickname.includes(' ')
      }

      expect(isValidNickname('テストユーザー')).toBe(true)
      expect(isValidNickname('Test123')).toBe(true)
      expect(isValidNickname('')).toBe(false) // 空文字
      expect(isValidNickname('a'.repeat(51))).toBe(false) // 長すぎる
      expect(isValidNickname('太郎 花子')).toBe(false) // スペース含む
    })

    it('有効な時間設定かチェック', () => {
      const isValidScheduledTime = (timeString: string): boolean => {
        const scheduledTime = new Date(timeString)
        const now = new Date()
        const maxTime = new Date(now.getTime() + 12 * 60 * 60 * 1000) // 12時間後
        
        return scheduledTime > now && scheduledTime <= maxTime
      }

      const now = new Date()
      const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2時間後
      const pastTime = new Date(now.getTime() - 1 * 60 * 60 * 1000) // 1時間前
      const tooFutureTime = new Date(now.getTime() + 15 * 60 * 60 * 1000) // 15時間後

      expect(isValidScheduledTime(futureTime.toISOString())).toBe(true)
      expect(isValidScheduledTime(pastTime.toISOString())).toBe(false)
      expect(isValidScheduledTime(tooFutureTime.toISOString())).toBe(false)
    })
  })

  describe('文字列処理', () => {
    it('場所の表示名を正しく処理する', () => {
      const getLocationDisplayName = (locationName?: string): string => {
        const locationMap: Record<string, string> = {
          'library': '図書館',
          'building1-1f': '1号館1F',
          'building1-2f': '1号館2F'
        }
        
        return locationName ? (locationMap[locationName] || locationName) : '場所未設定'
      }

      expect(getLocationDisplayName('library')).toBe('図書館')
      expect(getLocationDisplayName('building1-1f')).toBe('1号館1F')
      expect(getLocationDisplayName('unknown')).toBe('unknown')
      expect(getLocationDisplayName()).toBe('場所未設定')
      expect(getLocationDisplayName('')).toBe('場所未設定')
    })
  })
})