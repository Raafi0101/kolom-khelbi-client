const DIFFICULTY_CONFIG = {
    easy: { maxAngleNoise: 0.40, maxPowerNoise: 0.30, multiplier: 1.0 },
    medium: { maxAngleNoise: 0.15, maxPowerNoise: 0.10, multiplier: 1.0 },
    hard: { maxAngleNoise: 0.03, maxPowerNoise: 0.02, multiplier: 1.0 },
}

/**
 * Computes an AI shot vector directed towards the target with difficulty-based noise.
 *
 * @param {Object} params
 * @param {number[]} params.attackerPos - [x, y, z] of AI pen
 * @param {number[]} params.targetPos - [x, y, z] of human pen
 * @param {string} [params.difficulty='medium'] - 'easy' | 'medium' | 'hard'
 * @returns {{ dirX: number, dirZ: number, power: number }}
 */
export function computeAIShot({ attackerPos, targetPos, difficulty = 'medium' }) {
    const config = DIFFICULTY_CONFIG[difficulty?.toLowerCase()] || DIFFICULTY_CONFIG.medium

    const dx = targetPos[0] - attackerPos[0]
    const dz = targetPos[2] - attackerPos[2]
    const distance = Math.hypot(dx, dz) || 0.001

    // Base normalized direction towards target
    const baseDirX = dx / distance
    const baseDirZ = dz / distance

    // Base power clamped to [0.35, 0.95]
    const clampedBase = Math.min(Math.max(distance / 1.2, 0.35), 0.95)
    const basePower = clampedBase * config.multiplier

    // Random noise within ±range
    const angleNoise = (Math.random() * 2 - 1) * config.maxAngleNoise
    const powerNoise = (Math.random() * 2 - 1) * config.maxPowerNoise

    // Rotate direction vector by angleNoise radians
    const cosA = Math.cos(angleNoise)
    const sinA = Math.sin(angleNoise)
    const rotX = baseDirX * cosA - baseDirZ * sinA
    const rotZ = baseDirX * sinA + baseDirZ * cosA

    const rotLen = Math.hypot(rotX, rotZ) || 1
    const dirX = rotX / rotLen
    const dirZ = rotZ / rotLen

    // Modulate power by noise and clamp between [0.2, 1.0]
    const rawPower = basePower * (1 + powerNoise)
    const power = Math.min(Math.max(rawPower, 0.2), 1.0)

    return { dirX, dirZ, power }
}
