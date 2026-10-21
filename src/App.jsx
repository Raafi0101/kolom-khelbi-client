import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { Physics } from '@react-three/cannon'
import { useEffect, useState } from 'react'
import Scene from './game/Scene.jsx'
import Lobby from './ui/Lobby.jsx'
import HUD from './ui/HUD.jsx'
import { useGameStore } from './state/gameStore.js'
import { connect } from './net/socket.js'
import './styles.css'

export default function App() {
    const state = useGameStore()
    const [aspect, setAspect] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1.6
    )

    useEffect(() => {
        const onResize = () => setAspect(window.innerWidth / window.innerHeight)
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

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

    // Responsive Mobile Camera: lifts higher in mobile portrait so full table fits on any phone
    const isPortrait = aspect < 1.0
    const cameraPos = isPortrait ? [0, 3.45, 1.85] : [0, 2.35, 1.35]
    const cameraFov = isPortrait ? 54 : 42

    return (
        <div className="app">
            <Canvas shadows dpr={[1, 2]}>
                {/* Mobile-Adaptive fixed perspective camera */}
                <PerspectiveCamera makeDefault position={cameraPos} fov={cameraFov} />
                <ambientLight intensity={0.55} />
                <directionalLight
                    position={[3, 5, 2.5]}
                    intensity={1.4}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />
                <directionalLight position={[-3, 4, -2]} intensity={0.4} color="#88aaff" />
                <Physics
                    gravity={[0, -9.81, 0]}
                    defaultContactMaterial={{
                        restitution: 0.55, // Balanced, realistic plastic pen impact
                        friction: 0.28,    // Natural wooden desk friction
                        contactEquationStiffness: 1e7,
                        contactEquationRelaxation: 2,
                    }}
                >
                    <Scene />
                </Physics>
            </Canvas>
            <HUD />
            {state.error && <div className="error-toast">{state.error.message}</div>}
        </div>
    )
}
