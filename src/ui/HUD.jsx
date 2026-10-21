import { useGameStore } from '../state/gameStore.js'
import { endSoloGame } from '../state/localGame.js'

export default function HUD() {
    const s = useGameStore()

    if (s.soloMode) {
        const isHumanTurn = s.currentTurn === 'P1'
        const isFinished = s.phase === 'FINISHED'
        const humanWon = s.winner === 'P1'

        return (
            <div className="hud">
                <div className="row">
                    <strong>Kolom Khelbi</strong>
                    <span className="badge">Solo ({s.difficulty || 'medium'})</span>
                </div>
                <div className="row">
                    <span>You</span>
                    <span>Computer</span>
                </div>
                {isFinished ? (
                    <div className="row turn">
                        {humanWon ? '🏆 You win!' : '💀 Computer wins'}
                    </div>
                ) : (
                    <div className={`row turn ${isHumanTurn ? 'mine' : ''}`}>
                        {isHumanTurn ? '▶ Your turn — drag your pen' : "⏳ Computer's turn"}
                    </div>
                )}
                {isFinished && (
                    <button className="hud-btn" onClick={endSoloGame}>
                        Return to Lobby
                    </button>
                )}
            </div>
        )
    }

    const opp = s.mySlot === 'P1' ? 'P2' : 'P1'
    const oppConnected = s.players?.[opp]?.connected
    const myTurn = s.currentTurn === s.mySlot

    return (
        <div className="hud">
            <div className="row">
                <strong>Kolom Khelbi</strong>
                <span className="badge">Room {s.roomId}</span>
            </div>
            <div className="row">
                <span>You: <b>{s.mySlot}</b></span>
                <span>Opp: {oppConnected ? '●' : '○ waiting'}</span>
            </div>
            {s.phase === 'FINISHED' ? (
                <div className="row turn">{s.winner === s.mySlot ? '🏆 You win!' : '💀 You lose'}</div>
            ) : (
                <div className={`row turn ${myTurn ? 'mine' : ''}`}>
                    {myTurn ? '▶ Your turn — drag your pen' : "⏳ Opponent's turn"}
                </div>
            )}
        </div>
    )
}
