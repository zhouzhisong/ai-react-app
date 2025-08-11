export const storage = {
  get<T = unknown>(key: string): T | null {
    try {
      const value = localStorage.getItem(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      console.error(`读取 localStorage 错误：key=${key}`, error)
      return null
    }
  },

  set<T = unknown>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`写入 localStorage 错误：key=${key}`, error)
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`删除 localStorage 错误：key=${key}`, error)
    }
  },

  clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.error("清空 localStorage 错误", error)
    }
  },
}
