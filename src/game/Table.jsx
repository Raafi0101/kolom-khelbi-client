import { useBox } from '@react-three/cannon'
import { TABLE_WIDTH, TABLE_LENGTH } from './constants.js'

export default function Table() {
    const [ref] = useBox(() => ({
        type: 'Static',
        args: [TABLE_WIDTH, 0.1, TABLE_LENGTH],
        position: [0, -0.05, 0],
        material: { friction: 0.5, restitution: 0.2 },
    }))

    return (
        <group>
            <mesh ref={ref} receiveShadow>
                <boxGeometry args={[TABLE_WIDTH, 0.1, TABLE_LENGTH]} />
                <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.1} />
            </mesh>
            <mesh position={[0, -0.06, 0]} receiveShadow>
                <boxGeometry args={[TABLE_WIDTH + 0.04, 0.08, TABLE_LENGTH + 0.04]} />
                <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.2} />
            </mesh>
        </group>
    )
}
