/**
 * Strategic, Realistic AI for Kolom Khelbi
 * Mimics human pen-fight tactics:
 * - Edge detection & tactical push direction
 * - Off-center spin hits for maximum knockout torque
 * - Controlled, natural power scaling
 */

const DIFFICULTY_CONFIG = {
    easy: {
        maxAngleNoise: 0.28,
        powerNoise: 0.22,
        spinHitProbability: 0.25,
        tacticalAim: false,
    },
    medium: {
        maxAngleNoise: 0.10,
        powerNoise: 0.08,
        spinHitProbability: 0.70,
        tacticalAim: true,
    },
    hard: {
        maxAngleNoise: 0.02,
        powerNoise: 0.03,
        spinHitProbability: 0.95,
        tacticalAim: true,
    },
}

export function computeAIShot({ attackerPos, targetPos, difficulty = 'medium' }) {
    const config = DIFFICULTY_CONFIG[difficulty?.toLowerCase()] || DIFFICULTY_CONFIG.medium

    // 1. Strategic Target Point Calculation:
    // A skilled player aims towards the tips/ends of the opponent pen to spin it off the table!
    let targetX = targetPos[0]
    let targetZ = targetPos[2]

    if (config.spinHitProbability > 0 && Math.random() < config.spinHitProbability) {
        // Strike top end or bottom end to spin towards nearest boundary
        const aimOffset = targetZ >= 0 ? 0.11 : -0.11
        targetZ += aimOffset
    }

    // 2. Tactical Edge Push:
    // If player is already close to an edge, aim to push them off that specific edge!
    if (config.tacticalAim) {
        if (targetPos[0] < -0.5) {
            // Player is close to the left cliff -> push harder towards -X
            targetX += 0.05
        }
        if (Math.abs(targetPos[2]) > 0.3) {
            // Player is close to top/bottom cliff -> angle strike towards that edge
            const edgeDir = targetPos[2] > 0 ? 0.07 : -0.07
            targetZ += edgeDir
        }
    }

    const dx = targetX - attackerPos[0]
    const dz = targetZ - attackerPos[2]
    const distance = Math.hypot(dx, dz) || 0.001

    // Base direction towards calculated tactical target
    const baseDirX = dx / distance
    const baseDirZ = dz / distance

    // Base power calibrated to realistic table physics (0.35 to 0.88)
    const basePower = Math.min(Math.max(distance / 1.35, 0.35), 0.88)

    // Apply difficulty noise
    const angleNoise = (Math.random() * 2 - 1) * config.maxAngleNoise
    const pNoise = (Math.random() * 2 - 1) * config.powerNoise

    // Rotate direction vector by angleNoise radians
    const cosA = Math.cos(angleNoise)
    const sinA = Math.sin(angleNoise)
    const rotX = baseDirX * cosA - baseDirZ * sinA
    const rotZ = baseDirX * sinA + baseDirZ * cosA

    const rotLen = Math.hypot(rotX, rotZ) || 1
    const dirX = rotX / rotLen
    const dirZ = rotZ / rotLen

    // Modulate power
    const rawPower = basePower * (1 + pNoise)
    const power = Math.min(Math.max(rawPower, 0.20), 0.95)

    return { dirX, dirZ, power }
}
