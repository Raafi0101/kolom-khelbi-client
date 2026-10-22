import { useState } from 'react'
import { useGameStore, setState } from '../state/gameStore.js'
import { createRoom, joinRoom } from '../net/socket.js'
import { startSoloGame, startLocalGame } from '../state/localGame.js'
import { PEN_STYLES } from '../game/penStyles.js'

export default function Lobby() {
    const state = useGameStore()
    const [name, setName] = useState('')
    const [roomCode, setRoomCode] = useState('')
    const [mode, setMode] = useState('solo')
    const [difficulty, setDifficulty] = useState('medium')
    const [targetPoints, setTargetPoints] = useState(5)
    const [selectedPen, setSelectedPen] = useState('pinpoint')

    const [playerId] = useState(() => {
        let id = localStorage.getItem('kk_playerId')
        if (!id) {
            id = 'p_' + Math.random().toString(36).slice(2, 10)
            localStorage.setItem('kk_playerId', id)
        }
        return id
    })

    const handleCreate = () => {
        if (!name.trim()) return setState({ error: { code: 'NAME', message: 'Enter your name' } })
        setState({ myPlayerId: playerId, error: null })
        createRoom(playerId, name.trim())
    }

    const handleJoin = () => {
        if (!name.trim() || !roomCode.trim()) return
        setState({ myPlayerId: playerId, error: null })
        joinRoom(playerId, name.trim(), roomCode.trim().toUpperCase())
    }

    const handleStartSolo = () => {
        startSoloGame({
            difficulty,
            targetPoints,
            selectedPen,
        })
    }

    const handleStartLocal = () => {
        startLocalGame({
            difficulty,
            targetPoints,
            selectedPen,
        })
    }

    const penList = Object.values(PEN_STYLES)

    return (
        <div className="lobby-overlay">
            <div className="lobby-card">
                <header className="lobby-header">
                    <div className="game-badge">3D Pen Fight Arena</div>
                    <h1 className="game-title">KOLOM KHELBI</h1>
                    <p className="game-subtitle">The Legendary Real Pen Fight Battle</p>
                </header>

                <nav className="mode-tabs">
                    <button
                        type="button"
                        className={`tab-btn ${mode === 'solo' ? 'active' : ''}`}
                        onClick={() => setMode('solo')}
                    >
                        <span>🤖</span> Play vs AI
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${mode === 'create' ? 'active' : ''}`}
                        onClick={() => setMode('create')}
                    >
                        <span>⚔️</span> Create Room
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${mode === 'join' ? 'active' : ''}`}
                        onClick={() => setMode('join')}
                    >
                        <span>🔗</span> Join Room
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${mode === 'local' ? 'active' : ''}`}
                        onClick={() => setMode('local')}
                    >
                        <span>👥</span> Local 2‑P
                    </button>
                </nav>

                {mode === 'solo' ? (
                    <div className="solo-config">
                        {/* 1. Choose Your Pen */}
                        <div className="config-group">
                            <label className="config-label">
                                <span>🖊️ Choose Your Pen</span>
                                <span className="selected-pen-name">
                                    {PEN_STYLES[selectedPen]?.name}
                                </span>
                            </label>
                            <div className="pen-grid">
                                {penList.map((pen) => {
                                    const isSelected = selectedPen === pen.id
                                    return (
                                        <button
                                            key={pen.id}
                                            type="button"
                                            className={`pen-card ${isSelected ? 'selected' : ''}`}
                                            onClick={() => setSelectedPen(pen.id)}
                                        >
                                            <div className="pen-preview-bar">
                                                <div
                                                    className="pen-color-dot"
                                                    style={{ backgroundColor: pen.barrelColor }}
                                                />
                                                <div
                                                    className="pen-accent-dot"
                                                    style={{ backgroundColor: pen.clipColor }}
                                                />
                                            </div>
                                            <span className="pen-name">{pen.name}</span>
                                            <span className="pen-badge">{pen.badge}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* 2. Target Match Points (2 to 20) */}
                        <div className="config-group">
                            <div className="config-header-row">
                                <label className="config-label">
                                    🎯 Match Target Points (2 - 20)
                                </label>
                                <span className="points-display-val">{targetPoints} Points</span>
                            </div>
                            <div className="points-stepper">
                                <button
                                    type="button"
                                    className="step-btn"
                                    onClick={() => setTargetPoints((p) => Math.max(2, p - 1))}
                                >
                                    -
                                </button>
                                <input
                                    type="range"
                                    min="2"
                                    max="20"
                                    value={targetPoints}
                                    onChange={(e) => setTargetPoints(Number(e.target.value))}
                                    className="points-slider"
                                />
                                <button
                                    type="button"
                                    className="step-btn"
                                    onClick={() => setTargetPoints((p) => Math.min(20, p + 1))}
                                >
                                    +
                                </button>
                            </div>
                            <div className="quick-points">
                                {[3, 5, 10, 15, 20].map((pt) => (
                                    <button
                                        key={pt}
                                        type="button"
                                        className={`quick-pt-btn ${targetPoints === pt ? 'active' : ''}`}
                                        onClick={() => setTargetPoints(pt)}
                                    >
                                        {pt} Pts
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. AI Difficulty */}
                        <div className="config-group">
                            <label className="config-label">⚡ AI Difficulty</label>
                            <div className="difficulty-tabs">
                                {[
                                    { id: 'easy', label: 'Beginner', icon: '🟢' },
                                    { id: 'medium', label: 'Pro Fighter', icon: '🟡' },
                                    { id: 'hard', label: 'Master AI', icon: '🔴' },
                                    { id: 'expert', label: 'Grandmaster', icon: '⚫' },
                                ].map((d) => (
                                    <button
                                        key={d.id}
                                        type="button"
                                        className={`diff-tab ${difficulty === d.id ? 'active' : ''}`}
                                        onClick={() => setDifficulty(d.id)}
                                    >
                                        <span>{d.icon}</span> {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className="start-game-btn" onClick={handleStartSolo}>
                            🚀 Start Match
                        </button>
                    </div>
                ) : mode === 'local' ? (
                    <div className="solo-config">
                        {/* 1. Choose Your Pen */}
                        <div className="config-group">
                            <label className="config-label">
                                <span>🖊️ Choose Your Pen</span>
                                <span className="selected-pen-name">
                                    {PEN_STYLES[selectedPen]?.name}
                                </span>
                            </label>
                            <div className="pen-grid">
                                {penList.map((pen) => {
                                    const isSelected = selectedPen === pen.id
                                    return (
                                        <button
                                            key={pen.id}
                                            type="button"
                                            className={`pen-card ${isSelected ? 'selected' : ''}`}
                                            onClick={() => setSelectedPen(pen.id)}
                                        >
                                            <div className="pen-preview-bar">
                                                <div
                                                    className="pen-color-dot"
                                                    style={{ backgroundColor: pen.barrelColor }}
                                                />
                                                <div
                                                    className="pen-accent-dot"
                                                    style={{ backgroundColor: pen.clipColor }}
                                                />
                                            </div>
                                            <span className="pen-name">{pen.name}</span>
                                            <span className="pen-badge">{pen.badge}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* 2. Target Match Points (2 to 20) */}
                        <div className="config-group">
                            <div className="config-header-row">
                                <label className="config-label">
                                    🎯 Match Target Points (2 - 20)
                                </label>
                                <span className="points-display-val">{targetPoints} Points</span>
                            </div>
                            <div className="points-stepper">
                                <button
                                    type="button"
                                    className="step-btn"
                                    onClick={() => setTargetPoints((p) => Math.max(2, p - 1))}
                                >
                                    -
                                </button>
                                <input
                                    type="range"
                                    min="2"
                                    max="20"
                                    value={targetPoints}
                                    onChange={(e) => setTargetPoints(Number(e.target.value))}
                                    className="points-slider"
                                />
                                <button
                                    type="button"
                                    className="step-btn"
                                    onClick={() => setTargetPoints((p) => Math.min(20, p + 1))}
                                >
                                    +
                                </button>
                            </div>
                            <div className="quick-points">
                                {[3, 5, 10, 15, 20].map((pt) => (
                                    <button
                                        key={pt}
                                        type="button"
                                        className={`quick-pt-btn ${targetPoints === pt ? 'active' : ''}`}
                                        onClick={() => setTargetPoints(pt)}
                                    >
                                        {pt} Pts
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. AI Difficulty */}
                        <div className="config-group">
                            <label className="config-label">⚡ AI Difficulty</label>
                            <div className="difficulty-tabs">
                                {[
                                    { id: 'easy', label: 'Beginner', icon: '🟢' },
                                    { id: 'medium', label: 'Pro Fighter', icon: '🟡' },
                                    { id: 'hard', label: 'Master AI', icon: '🔴' },
                                ].map((d) => (
                                    <button
                                        key={d.id}
                                        type="button"
                                        className={`diff-tab ${difficulty === d.id ? 'active' : ''}`}
                                        onClick={() => setDifficulty(d.id)}
                                    >
                                        <span>{d.icon}</span> {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className="start-game-btn" onClick={handleStartLocal}>
                            🚀 Start 2‑Player Match
                        </button>
                    </div>
                ) : (
                    <div className="multiplayer-config">
                        <input
                            className="text-input"
                            placeholder="Enter your fighter name..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        {mode === 'create' ? (
                            <button className="start-game-btn" onClick={handleCreate}>
                                Create Online Room
                            </button>
                        ) : (
                            <>
                                <input
                                    className="text-input"
                                    placeholder="Room code (e.g. A9B2X1)"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    maxLength={6}
                                />
                                <button className="start-game-btn" onClick={handleJoin}>
                                    Join Battle Room
                                </button>
                            </>
                        )}

                        <p className="status-hint">
                            {state.connected ? '● Server Online' : '○ Connecting to server...'}
                        </p>
                    </div>
                )}

                <footer className="dev-credit-footer">
                    <span>Designed & Developed by <strong>Abdullah Al Rafi</strong></span>
                </footer>
            </div>
        </div>
    )
}
