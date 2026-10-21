import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { Physics } from '@react-three/cannon'
import { useEffect } from 'react'
import Scene from './game/Scene.jsx'
import Lobby from './ui/Lobby.jsx'
import HUD from './ui/HUD.jsx'
import { useGameStore } from './state/gameStore.js'
import { connect } from './net/socket.js'
import './styles.css'

export default function App() {
    const state = useGameStore()

    useEffect(() => {
        if (!state.soloMode) {
            connect()
        }
    }, [state.soloMode])

    const isGameActive = Boolean(state.roomId || state.soloMode)

    if (!isGameActive) {
        return (
            <div className="app">
                <Lobby />
                {state.error && <div className="error-toast">{state.error.message}</div>}
            </div>
        )
    }

    return (
        <div className="app">
            <Canvas shadows dpr={[1, 2]}>
                {/* Fixed, stable camera viewing the board perfectly */}
                <PerspectiveCamera makeDefault position={[0, 2.35, 1.4]} fov={44} />
                <ambientLight intensity={0.55} />
                <directionalLight
                    position={[3, 5, 2.5]}
                    intensity={1.4}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />
                <directionalLight position={[-3, 4, -2]} intensity={0.4} color="#88aaff" />
                <Physics gravity={[0, -9.81, 0]} defaultContactMaterial={{ restitution: 0.25, friction: 0.5 }}>
                    <Scene />
                </Physics>
            </Canvas>
            <HUD />
            {state.error && <div className="error-toast">{state.error.message}</div>}
        </div>
    )
}
