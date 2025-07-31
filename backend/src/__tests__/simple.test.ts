// 基本的なテストファイル
import { describe, it, expect } from '@jest/globals'

describe('Simple Tests', () => {
  it('基本的な計算が動作する', () => {
    expect(2 + 2).toBe(4)
  })

  it('文字列操作が動作する', () => {
    const greeting = 'Hello, World!'
    expect(greeting).toContain('World')
  })

  it('配列操作が動作する', () => {
    const numbers = [1, 2, 3, 4, 5]
    expect(numbers).toHaveLength(5)
    expect(numbers).toContain(3)
  })
})