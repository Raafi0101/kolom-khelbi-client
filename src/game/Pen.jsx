import { useEffect, useRef } from 'react'
import { useBox } from '@react-three/cannon'
import { PEN_LENGTH, PEN_RADIUS } from './constants.js'

export default function Pen({ position, rotationY = 0, color, onReady, onPointerDown }) {
    const [ref, api] = useBox(() => ({
        mass: 0.3,
        args: [PEN_LENGTH, PEN_RADIUS * 2, PEN_RADIUS * 2],
        position,
        rotation: [0, rotationY, 0],
        material: { friction: 0.4, restitution: 0.2 },
        linearDamping: 0.25,
        angularDamping: 0.4,
        allowSleep: true,
        sleepSpeedLimit: 0.15,
        sleepTimeLimit: 0.6,
    }))

    const posRef = useRef(position)
    const quatRef = useRef([0, 0, 0, 1])
    const velRef = useRef([0, 0, 0])
    const angVelRef = useRef([0, 0, 0])

    useEffect(() => {
        const unsubPos = api.position?.subscribe?.((v) => {
            posRef.current = v
        })
        const unsubQuat = api.quaternion?.subscribe?.((q) => {
            quatRef.current = q
        })
        const unsubVel = api.velocity?.subscribe?.((v) => {
            velRef.current = v
        })
        const unsubAngVel = api.angularVelocity?.subscribe?.((w) => {
            angVelRef.current = w
        })

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

    return (
        <group ref={ref} onPointerDown={onPointerDown}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[PEN_LENGTH, PEN_RADIUS * 2, PEN_RADIUS * 2]} />
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
            </mesh>
            <mesh position={[PEN_LENGTH / 2 - PEN_RADIUS, 0, 0]} castShadow>
                <sphereGeometry args={[PEN_RADIUS * 1.05, 12, 12]} />
                <meshStandardMaterial color="#0b0b0b" roughness={0.3} metalness={0.7} />
            </mesh>
            <mesh position={[-PEN_LENGTH / 2 + PEN_RADIUS, 0, 0]} castShadow>
                <sphereGeometry args={[PEN_RADIUS * 0.9, 12, 12]} />
                <meshStandardMaterial color="#f5f5f5" roughness={0.5} metalness={0.2} />
            </mesh>
        </group>
    )
}
