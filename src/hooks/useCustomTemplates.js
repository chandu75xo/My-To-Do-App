// useCustomTemplates.js
// Manages user-defined quick title templates per tag.
// Stored in localStorage — survives refreshes, private per browser.
// Custom templates show alongside built-in ones in TaskForm.

import { useState } from 'react'

const STORAGE_KEY = 'done-custom-templates'

const DEFAULT = {
  work:     [],
  home:     [],
  health:   [],
  shopping: [],
  personal: [],
}

export function useCustomTemplates() {
  const [custom, setCustom] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY)
      return s ? { ...DEFAULT, ...JSON.parse(s) } : DEFAULT
    } catch {
      return DEFAULT
    }
  })

  const save = (updated) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setCustom(updated)
  }

  const addTemplate = (tag, title) => {
    const t = title.trim()
    if (!t) return
    const existing = custom[tag] || []
    if (existing.includes(t)) return
    save({ ...custom, [tag]: [...existing, t] })
  }

  const deleteTemplate = (tag, title) => {
    save({ ...custom, [tag]: (custom[tag] || []).filter(t => t !== title) })
  }

  const editTemplate = (tag, oldTitle, newTitle) => {
    const t = newTitle.trim()
    if (!t || t === oldTitle) return
    save({
      ...custom,
      [tag]: (custom[tag] || []).map(x => x === oldTitle ? t : x)
    })
  }

  return { custom, addTemplate, deleteTemplate, editTemplate }
}
