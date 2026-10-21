import { useBox } from '@react-three/cannon'
import { TABLE_WIDTH, TABLE_LENGTH } from './constants.js'

export default function Table() {
    // Static wooden tabletop with authentic polished desk friction
    const [ref] = useBox(() => ({
        type: 'Static',
        args: [TABLE_WIDTH, 0.1, TABLE_LENGTH],
        position: [0, -0.05, 0],
        material: { friction: 0.35, restitution: 0.2 }, // Adjusted for realistic desk interaction
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
                    color="#854d0e" // Rich warm teak wood
                    roughness={0.32}
                    metalness={0.06}
                />
            </mesh>

            {/* 2. Decorative Dark Rosewood Beveled Border */}
            <mesh position={[0, -0.048, 0]} receiveShadow>
                <boxGeometry args={[TABLE_WIDTH + 0.045, 0.096, TABLE_LENGTH + 0.045]} />
                <meshStandardMaterial
                    color="#3e1d0c" // Deep rosewood framing
                    roughness={0.45}
                    metalness={0.12}
                />
            </mesh>

            {/* 3. Smooth Polished Desk Surface Center */}
            <mesh position={[0, 0.001, 0]} receiveShadow>
                <boxGeometry args={[TABLE_WIDTH - 0.05, 0.002, TABLE_LENGTH - 0.05]} />
                <meshStandardMaterial
                    color="#9a3412" // Rich amber polished finish
                    roughness={0.28}
                    metalness={0.08}
                />
            </mesh>

            {/* 4. Wood Plank Seam Grooves (Like a real classroom study desk) */}
            {[-0.35, 0, 0.35].map((z, idx) => (
                <mesh key={idx} position={[0, 0.002, z]} receiveShadow>
                    <boxGeometry args={[TABLE_WIDTH - 0.06, 0.001, 0.004]} />
                    <meshStandardMaterial color="#3e1d0c" roughness={0.9} />
                </mesh>
            ))}

            {/* 5. Brass Corner Accent Brackets */}
            {[
                [-TABLE_WIDTH / 2 + 0.04, -TABLE_LENGTH / 2 + 0.04],
                [TABLE_WIDTH / 2 - 0.04, -TABLE_LENGTH / 2 + 0.04],
                [-TABLE_WIDTH / 2 + 0.04, TABLE_LENGTH / 2 - 0.04],
                [TABLE_WIDTH / 2 - 0.04, TABLE_LENGTH / 2 - 0.04],
            ].map(([x, z], idx) => (
                <mesh key={idx} position={[x, 0.003, z]}>
                    <boxGeometry args={[0.06, 0.002, 0.06]} />
                    <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.2} />
                </mesh>
            ))}

            {/* 6. Table Frame Apron Underneath */}
            <mesh position={[0, -0.13, 0]} receiveShadow>
                <boxGeometry args={[TABLE_WIDTH - 0.15, 0.08, TABLE_LENGTH - 0.15]} />
                <meshStandardMaterial color="#2d1508" roughness={0.7} />
            </mesh>

            {/* 7. Four Solid Wooden Legs */}
            {[
                [-legX, -legHeight / 2 - 0.05, -legZ],
                [legX, -legHeight / 2 - 0.05, -legZ],
                [-legX, -legHeight / 2 - 0.05, legZ],
                [legX, -legHeight / 2 - 0.05, legZ],
            ].map(([x, y, z], idx) => (
                <mesh key={idx} position={[x, y, z]} castShadow receiveShadow>
                    <boxGeometry args={[legRadius * 2, legHeight, legRadius * 2]} />
                    <meshStandardMaterial color="#3e1d0c" roughness={0.55} />
                </mesh>
            ))}
        </group>
    )
}
