import { useSyncExternalStore } from 'react'

let state = {
    connected: false,
    roomId: null,
    myPlayerId: null,
    mySlot: null,
    phase: 'LOBBY',
    currentTurn: 'P1',
    winner: null,
    turnNumber: -1,
    players: null,
    dragging: false,
    error: null,
    soloMode: false,
    difficulty: 'medium',
}

const listeners = new Set()

export function subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
}

export function getState() {
    return state
}

export function setState(patch) {
    state = { ...state, ...patch }
    listeners.forEach((fn) => fn(state))
}

export function useGameStore() {
    return useSyncExternalStore(subscribe, getState, getState)
}
