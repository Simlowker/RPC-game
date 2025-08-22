//useUserStore.ts
import React, { useState, useCallback } from 'react'

export interface UserStore {
  /** Show disclaimer if first time user */
  newcomer: boolean
  /** User Modal */
  userModal: boolean
  /** A list of games played. The first time a game is opened we can display info */
  gamesPlayed: Array<string>
  /** The last pool a user had selected */
  lastSelectedPool: { token: string, authority?: string } | null
  markGameAsPlayed: (gameId: string, played: boolean) => void
  set: (partial: Partial<UserStore>) => void
}

// Simple localStorage-based user store
const getStoredData = (): Partial<UserStore> => {
  try {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

const setStoredData = (data: Partial<UserStore>) => {
  try {
    localStorage.setItem('user', JSON.stringify(data))
  } catch {
    // ignore
  }
}

let listeners: Array<(state: UserStore) => void> = []
let state: UserStore = {
  newcomer: true,
  userModal: false,
  lastSelectedPool: null,
  gamesPlayed: [],
  markGameAsPlayed: () => {},
  set: () => {},
  ...getStoredData()
}

const notifyListeners = () => {
  listeners.forEach(listener => listener(state))
}

const setState = (partial: Partial<UserStore>) => {
  state = { ...state, ...partial }
  setStoredData(state)
  notifyListeners()
}

state.set = setState
state.markGameAsPlayed = (gameId: string, played: boolean) => {
  const gamesPlayed = new Set(state.gamesPlayed)
  if (played) {
    gamesPlayed.add(gameId)
  } else {
    gamesPlayed.delete(gameId)
  }
  setState({ gamesPlayed: Array.from(gamesPlayed) })
}

/**
 * Store client settings here
 */
export const useUserStore = (selector: (state: UserStore) => any) => {
  const [, forceUpdate] = useState({})
  
  const subscribe = useCallback((listener: (state: UserStore) => void) => {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  }, [])

  const refresh = useCallback(() => forceUpdate({}), [])
  
  // Simple subscription for the selector
  React.useEffect(() => {
    return subscribe(refresh)
  }, [subscribe, refresh])

  return selector(state)
}
