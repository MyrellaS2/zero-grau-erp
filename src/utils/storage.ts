export function loadData<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key)

    if (!data) {
      return defaultValue
    }

    return JSON.parse(data)
  } catch {
    return defaultValue
  }
}

export function saveData<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeData(key: string) {
  localStorage.removeItem(key)
}