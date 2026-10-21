import { useGameStore } from '../state/gameStore.js'
import { endSoloGame, startNextRound, startSoloGame } from '../state/localGame.js'
import { PEN_STYLES } from '../game/penStyles.js'

export default function HUD() {
    const s = useGameStore()

    if (s.soloMode) {
        const isHumanTurn = s.currentTurn === 'P1'
        const isMatchOver = s.roundStatus === 'MATCH_OVER' || s.phase === 'FINISHED'
        const isRoundOver = s.roundStatus === 'ROUND_OVER'
        const humanWonRound = s.roundWinner === 'P1'
        const humanWonMatch = s.winner === 'P1'
        const p1Score = s.scores?.P1 || 0
        const p2Score = s.scores?.P2 || 0
        const target = s.targetPoints || 5
        const userPenName = PEN_STYLES[s.selectedPen]?.name || 'Classic Pen'

        return (
            <>
                {/* 1. Top Modern Scoreboard */}
                <div className="hud-top-bar">
                    <div className="score-panel">
                        <div className={`player-card ${isHumanTurn ? 'turn-active' : ''}`}>
                            <span className="player-tag">YOU (P1)</span>
                            <span className="player-score">{p1Score}</span>
                            <span className="pen-name-tag">{userPenName}</span>
                        </div>

                        <div className="match-center-info">
                            <span className="match-target-badge">First to {target} Pts</span>
                            <div className="vs-badge">VS</div>
                            <span className="round-counter">Round {s.roundNumber}</span>
                        </div>

                        <div className={`player-card ${!isHumanTurn ? 'turn-active' : ''}`}>
                            <span className="player-tag">COMPUTER (AI)</span>
                            <span className="player-score">{p2Score}</span>
                            <span className="ai-diff-tag">{s.difficulty || 'medium'}</span>
                        </div>
                    </div>

                    {/* Turn Instruction Pill */}
                    {!isRoundOver && !isMatchOver && (
                        <div className={`turn-pill ${isHumanTurn ? 'my-turn' : 'ai-turn'}`}>
                            {isHumanTurn ? (
                                <span>🎯 <strong>Your Turn:</strong> Drag your pen backward & release to shoot!</span>
                            ) : (
                                <span>⏳ <strong>Computer&apos;s Turn:</strong> Calculating trajectory...</span>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. Round Won Banner (Transient between rounds) */}
                {isRoundOver && (
                    <div className="round-modal-overlay">
                        <div className="round-modal-card">
                            <div className="round-icon">
                                {humanWonRound ? '🎉' : '💥'}
                            </div>
                            <h2>{humanWonRound ? 'Point to You!' : 'Point to Computer!'}</h2>
                            <p className="round-subtext">
                                {humanWonRound
                                    ? 'Brilliant strike! Opponent pen knocked off table.'
                                    : 'Careful! Your pen went over the edge.'}
                            </p>
                            <div className="round-score-pill">
                                Score: {p1Score} - {p2Score}
                            </div>
                            <button className="next-round-btn" onClick={startNextRound}>
                                Next Round (Auto in 2s) ➔
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. Final Match Victory / Game Over Screen */}
                {isMatchOver && (
                    <div className="victory-modal-overlay">
                        <div className="victory-modal-card">
                            <div className="confetti-row">🎊 🏆 🎊</div>
                            <h1 className="victory-title">
                                {humanWonMatch ? 'CONGRATULATIONS!' : 'MATCH COMPLETED'}
                            </h1>
                            <p className="victory-hero-text">
                                {humanWonMatch
                                    ? '🏆 You Won the Pen Fight Championship! 🏆'
                                    : '💀 Computer claims the match victory!'}
                            </p>

                            <div className="final-score-box">
                                <div className="score-col">
                                    <span className="col-label">YOU</span>
                                    <span className="col-val win">{p1Score}</span>
                                </div>
                                <div className="score-divider">-</div>
                                <div className="score-col">
                                    <span className="col-label">COMPUTER</span>
                                    <span className="col-val">{p2Score}</span>
                                </div>
                            </div>

                            <p className="stats-text">
                                Total Rounds Played: <strong>{s.roundNumber}</strong> · Target: <strong>{target} Points</strong>
                            </p>

                            <div className="victory-actions">
                                <button
                                    className="primary-action-btn"
                                    onClick={() =>
                                        startSoloGame({
                                            difficulty: s.difficulty,
                                            targetPoints: s.targetPoints,
                                            selectedPen: s.selectedPen,
                                        })
                                    }
                                >
                                    🔄 Play Again
                                </button>
                                <button className="secondary-action-btn" onClick={endSoloGame}>
                                    🏠 Return to Lobby
                                </button>
                            </div>

                            <div className="modal-credit-tag">
                                Development by <strong>Abdullah Al Rafi</strong>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Bottom Developer Credit & Controls */}
                <div className="hud-bottom-bar">
                    <button className="hud-lobby-btn" onClick={endSoloGame}>
                        ✕ Exit to Lobby
                    </button>
                    <div className="hud-dev-credit">
                        Development by <strong>Abdullah Al Rafi</strong>
                    </div>
                </div>
            </>
        )
    }

    // Multiplayer HUD flow
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
                <span>Opp: {oppConnected ? '● Connected' : '○ Waiting...'}</span>
            </div>
            {s.phase === 'FINISHED' ? (
                <div className="row turn">{s.winner === s.mySlot ? '🏆 You win!' : '💀 You lose'}</div>
            ) : (
                <div className={`row turn ${myTurn ? 'mine' : ''}`}>
                    {myTurn ? '▶ Your turn — drag your pen' : "⏳ Opponent's turn"}
                </div>
            )}
            <div className="hud-dev-credit" style={{ marginTop: '10px', fontSize: '11px', textAlign: 'center' }}>
                Development by <strong>Abdullah Al Rafi</strong>
            </div>
        </div>
    )
}
