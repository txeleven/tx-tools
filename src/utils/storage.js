export const isChromeStorage = (() => {
  try {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local
  } catch {
    return false
  }
})()

export async function getStorage(key, defaultValue = null, area = 'local') {
  if (isChromeStorage) {
    try {
      const result = await chrome.storage[area].get(key)
      return key in result ? result[key] : defaultValue
    } catch {
      // fallthrough
    }
  }
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? defaultValue : JSON.parse(raw)
  } catch {
    return defaultValue
  }
}

export async function setStorage(key, value, area = 'local') {
  if (isChromeStorage) {
    try {
      await chrome.storage[area].set({ [key]: value })
      return
    } catch {
      // fallthrough
    }
  }
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export async function removeStorage(key, area = 'local') {
  if (isChromeStorage) {
    try {
      await chrome.storage[area].remove(key)
      return
    } catch {
      // fallthrough
    }
  }
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}
