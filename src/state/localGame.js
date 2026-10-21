import { setState, getState } from './gameStore.js'

export function startSoloGame(difficulty = 'medium') {
    setState({
        soloMode: true,
        difficulty,
        phase: 'IN_PROGRESS',
        currentTurn: 'P1',
        winner: null,
        turnNumber: 0,
        mySlot: 'P1',
        aiSlot: 'P2',
        roomId: 'SOLO',
        myPlayerId: 'human',
        players: null,
        dragging: false,
        error: null,
    })
}

export function applyShotResult({ shooterSlot, shooterOnTable, opponentOnTable }) {
    const oppSlot = shooterSlot === 'P1' ? 'P2' : 'P1'
    const nextTurnNumber = getState().turnNumber + 1

    if (!shooterOnTable) {
        // If shooter pen falls off table, opponent wins (even if both fall off)
        setState({
            phase: 'FINISHED',
            winner: oppSlot,
            turnNumber: nextTurnNumber,
        })
    } else if (!opponentOnTable) {
        // Opponent pen falls off table, shooter wins
        setState({
            phase: 'FINISHED',
            winner: shooterSlot,
            turnNumber: nextTurnNumber,
        })
    } else {
        // Both pens remain on table, alternate turns
        setState({
            currentTurn: oppSlot,
            turnNumber: nextTurnNumber,
        })
    }
}

export function endSoloGame() {
    setState({
        soloMode: false,
        roomId: null,
        phase: 'LOBBY',
        currentTurn: 'P1',
        winner: null,
        turnNumber: -1,
        players: null,
    })
}
