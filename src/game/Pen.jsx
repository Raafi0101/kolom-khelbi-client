import { useEffect, useRef } from 'react'
import { useBox } from '@react-three/cannon'
import { PEN_LENGTH, PEN_RADIUS } from './constants.js'
import { PEN_STYLES } from './penStyles.js'
import { playClashSound } from '../audio/soundEffects.js'

export default function Pen({
    position,
    rotationY = 0,
    styleId = 'pinpoint',
    customColor,
    onReady,
    onPointerDown,
}) {
    const penStyle = PEN_STYLES[styleId] || PEN_STYLES.pinpoint
    const barrelColor = customColor || penStyle.barrelColor

    // Realistic physical pen specs with natural desktop resistance and solid momentum transfer
    const [ref, api] = useBox(() => ({
        mass: 0.6, // increased weight for realistic slide
        args: [PEN_LENGTH, PEN_RADIUS * 2, PEN_RADIUS * 2],
        position,
        rotation: [0, rotationY, 0],
        material: { friction: 0.5, restitution: 0.05 }, // higher friction, low bounce
        linearDamping: 0.35, // stronger deceleration
        angularDamping: 0.2, // more spin damping
        angularFactor: [0, 1, 0], // only yaw rotation (around Y axis)
    linearFactor: [1, 0, 1], // constrain vertical movement
    allowSleep: true,
        sleepSpeedLimit: 0.2,
        sleepTimeLimit: 0.5,
        onCollide: (e) => {
            const vel = e.contact?.impactVelocity || 0.8
            playClashSound(Math.min(1, vel / 2.5))
        },
    }))

    const posRef = useRef(position)
    const quatRef = useRef([0, 0, 0, 1])
    const velRef = useRef([0, 0, 0])
    const angVelRef = useRef([0, 0, 0])

    useEffect(() => {
        const unsubPos = api.position?.subscribe?.((v) => { posRef.current = v })
        const unsubQuat = api.quaternion?.subscribe?.((q) => { quatRef.current = q })
        const unsubVel = api.velocity?.subscribe?.((v) => { velRef.current = v })
        const unsubAngVel = api.angularVelocity?.subscribe?.((w) => { angVelRef.current = w })

        const wrappedApi = {
            ...api,
            position: {
                ...api.position,
                get: api.position?.get ? api.position.get.bind(api.position) : () => posRef.current,
            },
            quaternion: {
                ...api.quaternion,
                get: api.quaternion?.get ? api.quaternion.get.bind(api.quaternion) : () => quatRef.current,
            },
            velocity: {
                ...api.velocity,
                get: api.velocity?.get ? api.velocity.get.bind(api.velocity) : () => velRef.current,
            },
            angularVelocity: {
                ...api.angularVelocity,
                get: api.angularVelocity?.get ? api.angularVelocity.get.bind(api.angularVelocity) : () => angVelRef.current,
            },
        }

        onReady?.(wrappedApi)

        return () => {
            unsubPos?.()
            unsubQuat?.()
            unsubVel?.()
            unsubAngVel?.()
        }
    }, [api, onReady])

    // Cylinder rotation to align along the physics box axis
    const rotX = [0, 0, Math.PI / 2]

    return (
        <group ref={ref} onPointerDown={onPointerDown} dispose={null}>
            {/* Enlarged touch target for mobile phones (invisible proxy mesh) */}
            <mesh visible={false} position={[0, 0, 0]}>
                <boxGeometry args={[PEN_LENGTH * 1.4, 0.26, 0.26]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* 1. Main Barrel (Body) */}
            <mesh position={[-0.04, 0, 0]} rotation={rotX} castShadow receiveShadow>
                <cylinderGeometry args={[PEN_RADIUS * 0.95, PEN_RADIUS * 0.95, 0.22, 24]} />
                <meshStandardMaterial
                    color={barrelColor}
                    roughness={penStyle.roughness}
                    metalness={penStyle.metalness}
                />
            </mesh>

            {/* 2. Finger Grip Area */}
            <mesh position={[0.10, 0, 0]} rotation={rotX} castShadow receiveShadow>
                <cylinderGeometry args={[PEN_RADIUS * 1.02, PEN_RADIUS * 1.02, 0.08, 24]} />
                <meshStandardMaterial
                    color={penStyle.gripColor}
                    roughness={0.65}
                    metalness={0.1}
                />
            </mesh>

            {/* 3. Metallic Accent Ring (between barrel and grip) */}
            <mesh position={[0.06, 0, 0]} rotation={rotX} castShadow>
                <cylinderGeometry args={[PEN_RADIUS * 1.04, PEN_RADIUS * 1.04, 0.008, 24]} />
                <meshStandardMaterial
                    color={penStyle.metalColor}
                    metalness={0.9}
                    roughness={0.15}
                />
            </mesh>

            {/* 4. Tapered Front Cone Tip */}
            <mesh position={[0.165, 0, 0]} rotation={rotX} castShadow>
                <cylinderGeometry args={[PEN_RADIUS * 0.35, PEN_RADIUS * 0.98, 0.05, 24]} />
                <meshStandardMaterial
                    color={penStyle.metalColor}
                    metalness={0.88}
                    roughness={0.2}
                />
            </mesh>

            {/* 5. Ballpoint Nib Point */}
            <mesh position={[0.194, 0, 0]} rotation={rotX} castShadow>
                <cylinderGeometry args={[0.004, 0.005, 0.012, 16]} />
                <meshStandardMaterial
                    color="#020617"
                    metalness={0.95}
                    roughness={0.1}
                />
            </mesh>

            {/* 6. Rear End Plug / Cap */}
            <mesh position={[-0.16, 0, 0]} rotation={rotX} castShadow>
                <cylinderGeometry args={[PEN_RADIUS * 0.88, PEN_RADIUS * 0.95, 0.025, 24]} />
                <meshStandardMaterial
                    color={penStyle.capColor}
                    roughness={0.4}
                    metalness={0.2}
                />
            </mesh>
            <mesh position={[-0.175, 0, 0]} castShadow>
                <sphereGeometry args={[PEN_RADIUS * 0.88, 16, 16]} />
                <meshStandardMaterial
                    color={penStyle.capColor}
                    roughness={0.4}
                    metalness={0.2}
                />
            </mesh>

            {/* 7. Realistic Pocket Clip */}
            <group position={[-0.10, PEN_RADIUS * 1.15, 0]}>
                <mesh position={[0, 0.004, 0]} castShadow>
                    <boxGeometry args={[0.10, 0.006, 0.014]} />
                    <meshStandardMaterial
                        color={penStyle.clipColor}
                        metalness={penStyle.metalness > 0.4 ? 0.9 : 0.3}
                        roughness={0.25}
                    />
                </mesh>
                <mesh position={[-0.05, -0.004, 0]} castShadow>
                    <boxGeometry args={[0.012, 0.016, 0.014]} />
                    <meshStandardMaterial
                        color={penStyle.clipColor}
                        metalness={0.8}
                        roughness={0.3}
                    />
                </mesh>
                <mesh position={[0.052, 0.008, 0]} castShadow>
                    <sphereGeometry args={[0.006, 12, 12]} />
                    <meshStandardMaterial
                        color={penStyle.clipColor}
                        metalness={0.8}
                        roughness={0.3}
                    />
                </mesh>
            </group>
        </group>
    )
}
