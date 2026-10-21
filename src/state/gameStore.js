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
    localMode: false,
    soloMode: false,
    difficulty: 'medium',
    targetPoints: 5,
    scores: { P1: 0, P2: 0 },
    roundNumber: 1,
    roundWinner: null,
    roundStatus: 'PLAYING', // 'PLAYING' | 'ROUND_OVER' | 'MATCH_OVER'
    selectedPen: 'pinpoint',
    aiPen: 'all_time_blue',
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
