import { useState } from 'react'
import { useGameStore, setState } from '../state/gameStore.js'
import { createRoom, joinRoom } from '../net/socket.js'
import { startSoloGame } from '../state/localGame.js'

export default function Lobby() {
    const state = useGameStore()
    const [name, setName] = useState('')
    const [roomCode, setRoomCode] = useState('')
    const [mode, setMode] = useState('solo')
    const [difficulty, setDifficulty] = useState('medium')

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
        startSoloGame(difficulty)
    }

    return (
        <div className="lobby">
            <h1>Kolom Khelbi</h1>
            <p className="sub">Turn-based pen fight game</p>

            <div className="mode-toggle">
                <button
                    type="button"
                    className={mode === 'solo' ? 'active' : ''}
                    onClick={() => setMode('solo')}
                >
                    Play vs Computer
                </button>
                <button
                    type="button"
                    className={mode === 'create' ? 'active' : ''}
                    onClick={() => setMode('create')}
                >
                    Create
                </button>
                <button
                    type="button"
                    className={mode === 'join' ? 'active' : ''}
                    onClick={() => setMode('join')}
                >
                    Join
                </button>
            </div>

            {mode === 'solo' ? (
                <>
                    <div className="difficulty-section">
                        <span>Select Difficulty</span>
                        <div className="difficulty-buttons">
                            {['easy', 'medium', 'hard'].map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    className={difficulty === d ? 'active' : ''}
                                    onClick={() => setDifficulty(d)}
                                >
                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button className="primary solo" onClick={handleStartSolo}>
                        Start Solo Game
                    </button>
                </>
            ) : (
                <>
                    <input
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    {mode === 'create' ? (
                        <button className="primary" onClick={handleCreate}>
                            Create Room
                        </button>
                    ) : (
                        <>
                            <input
                                placeholder="Room code (6 chars)"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                maxLength={6}
                            />
                            <button className="primary" onClick={handleJoin}>
                                Join Room
                            </button>
                        </>
                    )}

                    <p className="hint">
                        {state.connected ? '● Connected' : '○ Connecting...'}
                    </p>
                </>
            )}
        </div>
    )
}
