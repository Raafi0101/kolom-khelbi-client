import { setState, getState } from './gameStore.js'
import {
    playFallSound,
    playPointSound,
    playVictorySound,
    playDefeatSound,
} from '../audio/soundEffects.js'

let nextRoundTimer = null

export function startSoloGame(options = {}) {
    if (nextRoundTimer) {
        clearTimeout(nextRoundTimer)
        nextRoundTimer = null
    }

    const difficulty = typeof options === 'string' ? options : options.difficulty || 'medium'
    const targetPoints = typeof options === 'object' && options.targetPoints ? options.targetPoints : 5
    const selectedPen = typeof options === 'object' && options.selectedPen ? options.selectedPen : 'pinpoint'
    const aiPen = selectedPen === 'all_time_blue' ? 'gel_black' : 'all_time_blue'

    setState({
        soloMode: true,
        difficulty,
        targetPoints: Math.min(20, Math.max(2, targetPoints)),
        scores: { P1: 0, P2: 0 },
        roundNumber: 1,
        roundWinner: null,
        roundStatus: 'PLAYING',
        phase: 'IN_PROGRESS',
        currentTurn: 'P1',
        winner: null,
        turnNumber: 0,
        mySlot: 'P1',
        aiSlot: 'P2',
        roomId: 'SOLO',
        myPlayerId: 'human',
        selectedPen,
        aiPen,
        players: null,
        dragging: false,
        error: null,
    })
}

export function startNextRound() {
    if (nextRoundTimer) {
        clearTimeout(nextRoundTimer)
        nextRoundTimer = null
    }

    const s = getState()
    const nextRound = s.roundNumber + 1
    // Winner of previous round starts the next round (classic rule)
    const nextShooter = s.roundWinner || 'P1'

    setState({
        roundNumber: nextRound,
        roundStatus: 'PLAYING',
        roundWinner: null,
        phase: 'IN_PROGRESS',
        currentTurn: nextShooter,
        turnNumber: 0, // signals Scene to reset physics bodies
        dragging: false,
    })
}

export function applyShotResult({ shooterSlot, shooterOnTable, opponentOnTable }) {
    const s = getState()
    const oppSlot = shooterSlot === 'P1' ? 'P2' : 'P1'
    const nextTurnNumber = s.turnNumber + 1

    let roundEnded = false
    let roundWinner = null

    if (!shooterOnTable) {
        // Initiator falls off - opponent wins round (even if both fall)
        roundEnded = true
        roundWinner = oppSlot
    } else if (!opponentOnTable) {
        // Opponent knocked off table - shooter wins round
        roundEnded = true
        roundWinner = shooterSlot
    }

    if (roundEnded) {
        playFallSound()
        playPointSound()

        const currentScore = s.scores?.[roundWinner] || 0
        const newScore = currentScore + 1
        const updatedScores = { ...s.scores, [roundWinner]: newScore }
        const target = s.targetPoints || 5

        if (newScore >= target) {
            // Match is officially won!
            if (roundWinner === 'P1') {
                playVictorySound()
            } else {
                playDefeatSound()
            }

            setState({
                scores: updatedScores,
                roundStatus: 'MATCH_OVER',
                roundWinner,
                winner: roundWinner,
                phase: 'FINISHED',
                turnNumber: nextTurnNumber,
            })
        } else {
            // Round finished, proceed to next round
            setState({
                scores: updatedScores,
                roundStatus: 'ROUND_OVER',
                roundWinner,
                turnNumber: nextTurnNumber,
            })

            // Automatically advance to next round after 2.4 seconds
            if (nextRoundTimer) clearTimeout(nextRoundTimer)
            nextRoundTimer = setTimeout(() => {
                if (getState().roundStatus === 'ROUND_OVER') {
                    startNextRound()
                }
            }, 2400)
        }
    } else {
        // Both pens remain on table, continue turn alternation
        setState({
            currentTurn: oppSlot,
            turnNumber: nextTurnNumber,
        })
    }
}

export function endSoloGame() {
    if (nextRoundTimer) {
        clearTimeout(nextRoundTimer)
        nextRoundTimer = null
    }

    setState({
        soloMode: false,
        roomId: null,
        phase: 'LOBBY',
        currentTurn: 'P1',
        winner: null,
        turnNumber: -1,
        players: null,
        scores: { P1: 0, P2: 0 },
        roundNumber: 1,
        roundWinner: null,
        roundStatus: 'PLAYING',
    })
}
