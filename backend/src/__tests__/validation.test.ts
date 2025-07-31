// バリデーション機能のテスト
import { describe, it, expect } from '@jest/globals'

// セッションデータのバリデーション関数
const validateSessionData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!data.nickname || typeof data.nickname !== 'string') {
    errors.push('ニックネームは必須です')
  } else if (data.nickname.length > 50) {
    errors.push('ニックネームは50文字以内にしてください')
  }
  
  if (!data.scheduledEndTime) {
    errors.push('退室予定時刻は必須です')
  } else {
    const endTime = new Date(data.scheduledEndTime)
    const now = new Date()
    if (endTime <= now) {
      errors.push('退室予定時刻は現在時刻より後に設定してください')
    }
  }
  
  if (data.location && data.location.length > 100) {
    errors.push('学習場所は100文字以内にしてください')
  }
  
  if (data.subject && data.subject.length > 100) {
    errors.push('学習科目は100文字以内にしてください')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// フィードバックデータのバリデーション関数
const validateFeedbackData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  const validCategories = ['location', 'bug', 'feature', 'other']
  
  if (!data.category || !validCategories.includes(data.category)) {
    errors.push('有効なカテゴリを選択してください')
  }
  
  if (!data.content || typeof data.content !== 'string') {
    errors.push('内容は必須です')
  } else if (data.content.length < 10) {
    errors.push('内容は10文字以上入力してください')
  } else if (data.content.length > 1000) {
    errors.push('内容は1000文字以内にしてください')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// レート制限チェック関数
const checkRateLimit = (ip: string, lastSubmission: Record<string, number>): boolean => {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  
  if (lastSubmission[ip] && now - lastSubmission[ip] < oneDay) {
    return false // 制限中
  }
  
  return true // 送信可能
}

describe('バリデーション機能', () => {
  describe('セッションデータのバリデーション', () => {
    it('有効なデータで成功する', () => {
      const validData = {
        nickname: 'テストユーザー',
        location: 'library',
        subject: '数学',
        scheduledEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        showDuration: true
      }
      
      const result = validateSessionData(validData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('最小限のデータで成功する', () => {
      const minimalData = {
        nickname: 'User',
        scheduledEndTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }
      
      const result = validateSessionData(minimalData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('ニックネームが空の場合に失敗する', () => {
      const invalidData = {
        nickname: '',
        scheduledEndTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }
      
      const result = validateSessionData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('ニックネームは必須です')
    })

    it('ニックネームが長すぎる場合に失敗する', () => {
      const invalidData = {
        nickname: 'a'.repeat(51),
        scheduledEndTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }
      
      const result = validateSessionData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('ニックネームは50文字以内にしてください')
    })

    it('過去の時刻が設定された場合に失敗する', () => {
      const invalidData = {
        nickname: 'テストユーザー',
        scheduledEndTime: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1時間前
      }
      
      const result = validateSessionData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('退室予定時刻は現在時刻より後に設定してください')
    })
  })

  describe('フィードバックデータのバリデーション', () => {
    it('有効なデータで成功する', () => {
      const validData = {
        category: 'bug',
        content: 'バグを発見しました。詳細は以下の通りです。'
      }
      
      const result = validateFeedbackData(validData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('無効なカテゴリで失敗する', () => {
      const invalidData = {
        category: 'invalid',
        content: '有効な内容です。十分な文字数があります。'
      }
      
      const result = validateFeedbackData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('有効なカテゴリを選択してください')
    })

    it('内容が短すぎる場合に失敗する', () => {
      const invalidData = {
        category: 'other',
        content: 'short'
      }
      
      const result = validateFeedbackData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('内容は10文字以上入力してください')
    })

    it('内容が長すぎる場合に失敗する', () => {
      const invalidData = {
        category: 'other',
        content: 'a'.repeat(1001)
      }
      
      const result = validateFeedbackData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('内容は1000文字以内にしてください')
    })
  })

  describe('レート制限機能', () => {
    it('初回送信は許可される', () => {
      const result = checkRateLimit('192.168.1.1', {})
      expect(result).toBe(true)
    })

    it('24時間以内の再送信は拒否される', () => {
      const now = Date.now()
      const oneHourAgo = now - 60 * 60 * 1000
      const lastSubmission = {
        '192.168.1.1': oneHourAgo
      }
      
      const result = checkRateLimit('192.168.1.1', lastSubmission)
      expect(result).toBe(false)
    })

    it('24時間経過後の送信は許可される', () => {
      const now = Date.now()
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000
      const lastSubmission = {
        '192.168.1.1': twoDaysAgo
      }
      
      const result = checkRateLimit('192.168.1.1', lastSubmission)
      expect(result).toBe(true)
    })

    it('異なるIPは独立して管理される', () => {
      const now = Date.now()
      const oneHourAgo = now - 60 * 60 * 1000
      const lastSubmission = {
        '192.168.1.1': oneHourAgo
      }
      
      const result1 = checkRateLimit('192.168.1.1', lastSubmission)
      const result2 = checkRateLimit('192.168.1.2', lastSubmission)
      
      expect(result1).toBe(false) // 制限中
      expect(result2).toBe(true)  // 別IP、送信可能
    })
  })

  describe('データの正規化', () => {
    it('文字列の前後の空白を除去する', () => {
      const normalize = (str: string): string => str.trim()
      
      expect(normalize('  テスト  ')).toBe('テスト')
      expect(normalize('\n\tユーザー\t\n')).toBe('ユーザー')
      expect(normalize('normal')).toBe('normal')
    })

    it('HTMLタグをサニタイズする', () => {
      const sanitize = (str: string): string => {
        // scriptタグとstyleタグは内容も含めて完全除去
        return str
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<style[^>]*>.*?<\/style>/gi, '')
          .replace(/<[^>]*>/g, '')
      }
      
      expect(sanitize('<script>alert("xss")</script>テスト')).toBe('テスト')
      expect(sanitize('<b>太字</b>のテキスト')).toBe('太字のテキスト')
      expect(sanitize('普通のテキスト')).toBe('普通のテキスト')
    })
  })
})