import { useBox } from '@react-three/cannon'
import { TABLE_WIDTH, TABLE_LENGTH } from './constants.js'

export default function Table() {
    // Static wooden tabletop with smooth glide
    const [ref] = useBox(() => ({
        type: 'Static',
        args: [TABLE_WIDTH, 0.1, TABLE_LENGTH],
        position: [0, -0.05, 0],
        material: { friction: 0.08, restitution: 0.6 },
    }))

    const legHeight = 1.2
    const legRadius = 0.05
    const legX = TABLE_WIDTH / 2 - 0.08
    const legZ = TABLE_LENGTH / 2 - 0.08

    return (
        <group>
            {/* 1. Main Polished Wood Tabletop (Physics body attached) */}
            <mesh ref={ref} receiveShadow>
                <boxGeometry args={[TABLE_WIDTH, 0.1, TABLE_LENGTH]} />
                <meshStandardMaterial
                    color="#854d0e" // Warm teak/walnut wood
                    roughness={0.35}
                    metalness={0.05}
                />
            </mesh>

            {/* 2. Decorative Dark Hardwood Outer Rim / Frame */}
            <mesh position={[0, -0.05, 0]} receiveShadow>
                <boxGeometry args={[TABLE_WIDTH + 0.04, 0.09, TABLE_LENGTH + 0.04]} />
                <meshStandardMaterial
                    color="#451a03" // Deep mahogany border
                    roughness={0.45}
                    metalness={0.1}
                />
            </mesh>

            {/* 3. Smooth Beveled Tabletop Surface Inlay */}
            <mesh position={[0, 0.001, 0]} receiveShadow>
                <boxGeometry args={[TABLE_WIDTH - 0.06, 0.002, TABLE_LENGTH - 0.06]} />
                <meshStandardMaterial
                    color="#9a3412" // Polished wood center
                    roughness={0.3}
                    metalness={0.08}
                />
            </mesh>

            {/* 4. Table Frame Apron Underneath */}
            <mesh position={[0, -0.13, 0]} receiveShadow>
                <boxGeometry args={[TABLE_WIDTH - 0.15, 0.08, TABLE_LENGTH - 0.15]} />
                <meshStandardMaterial color="#3e1d0c" roughness={0.7} />
            </mesh>

            {/* 5. Four Solid Wooden Legs */}
            {[
                [-legX, -legHeight / 2 - 0.05, -legZ],
                [legX, -legHeight / 2 - 0.05, -legZ],
                [-legX, -legHeight / 2 - 0.05, legZ],
                [legX, -legHeight / 2 - 0.05, legZ],
            ].map(([x, y, z], idx) => (
                <mesh key={idx} position={[x, y, z]} castShadow receiveShadow>
                    <boxGeometry args={[legRadius * 2, legHeight, legRadius * 2]} />
                    <meshStandardMaterial color="#451a03" roughness={0.6} />
                </mesh>
            ))}
        </group>
    )
}
